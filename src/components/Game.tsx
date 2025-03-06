import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import decomp from "poly-decomp";
import styles from "./Game.module.css";

const Game = () => {
    const sceneRef = useRef<HTMLDivElement>(null);
    const renderRef = useRef<Matter.Render | null>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const runnerRef = useRef<Matter.Runner | null>(null);
    const [count, setCount] = useState(0);
    const countRef = useRef(count);
    const [score, setScore] = useState(0);
    const scoreRef = useRef(score);
    const [fallenCount, setFallenCount] = useState(0);
    const fallenCountRef = useRef(fallenCount);
    const [isGameActive, setIsGameActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(10);
    const [moyashiInterval, setMoyashiInterval] =
        useState<NodeJS.Timeout | null>(null);

    const isGameActiveRef = useRef(isGameActive);
    const moyashiSizes = [
        { width: 6, height: 50 },
        { width: 6, height: 60 },
        { width: 6, height: 70 },
        { width: 7, height: 50 },
        { width: 7, height: 60 },
        { width: 7, height: 70 },
        { width: 8, height: 50 },
        { width: 8, height: 60 },
        { width: 8, height: 70 },
        { width: 9, height: 50 },
        { width: 9, height: 60 },
        { width: 9, height: 70 },
        { width: 10, height: 50 },
        { width: 10, height: 60 },
        { width: 10, height: 70 },
    ];

    useEffect(() => {
        countRef.current = count;
    }, [count]);

    useEffect(() => {
        scoreRef.current = score;
    }, [score]);

    useEffect(() => {
        fallenCountRef.current = fallenCount;
    }, [fallenCount]);

    useEffect(() => {
        isGameActiveRef.current = isGameActive;
    }, [isGameActive]);

    useEffect(() => {
        if (!sceneRef.current || renderRef.current) return;

        Matter.Common.setDecomp(decomp);
        const engine = Matter.Engine.create();
        const render = Matter.Render.create({
            element: sceneRef.current,
            engine: engine,
            options: {
                width: 390,
                height: 844,
                background: "#f8f1e4",
                wireframes: false,
            },
        });

        engineRef.current = engine;
        renderRef.current = render;

        // どんぶりを作成
        const bowl = Matter.Bodies.fromVertices(
            195,
            694,
            [
                [
                    { x: 110, y: 700 },
                    { x: 90, y: 600 },
                    { x: 80, y: 500 },
                    { x: 160, y: 500 },
                    { x: 230, y: 500 },
                    { x: 310, y: 500 },
                    { x: 300, y: 600 },
                    { x: 280, y: 700 },
                    { x: 250, y: 750 },
                    { x: 150, y: 750 },
                ],
            ],
            {
                isStatic: true,
                restitution: 0,
                render: { fillStyle: "brown" },
            }
        );

        const leftWall = Matter.Bodies.rectangle(-50, 422, 20, 844, {
            isStatic: true,
        });
        const rightWall = Matter.Bodies.rectangle(440, 422, 20, 844, {
            isStatic: true,
        });
        const bottomSensor = Matter.Bodies.rectangle(195, 844, 390, 20, {
            isStatic: true,
            isSensor: true,
            render: { visible: false },
        });

        Matter.World.add(engine.world, [
            bowl,
            leftWall,
            rightWall,
            bottomSensor,
        ]);

        const runner = Matter.Runner.create();
        runnerRef.current = runner;
        Matter.Runner.run(runner, engine);
        Matter.Render.run(render);

        Matter.Events.on(engine, "collisionStart", (event) => {
            event.pairs.forEach((pair) => {
                if (
                    pair.bodyA === bottomSensor ||
                    pair.bodyB === bottomSensor
                ) {
                    const moyashi =
                        pair.bodyA === bottomSensor ? pair.bodyB : pair.bodyA;
                    Matter.World.remove(engine.world, moyashi);
                    setCount((prev) => prev - 1);
                    setFallenCount((prev) => prev + 1);
                }
            });
        });

        render.canvas.addEventListener("click", handleClick);

        return () => {
            render.canvas.removeEventListener("click", handleClick);
            Matter.Render.stop(render);
            Matter.Engine.clear(engine);
            Matter.Runner.stop(runner);

            renderRef.current = null;
            engineRef.current = null;
            runnerRef.current = null;
            setCount(0);
            setFallenCount(0);
            setScore(0);
            if (moyashiInterval) clearInterval(moyashiInterval);
        };
    }, [moyashiInterval]);

    // スコア計算を追加
    useEffect(() => {
        // countが増えるたびに+100点、fallenCountが増えるたびに-35点
        const newScore = count * 100 - fallenCount * 35; // スコアの計算
        setScore(newScore); // スコアを更新
    }, [count, fallenCount]);

    // スタート前にランダムにもやしが降りるように設定
    useEffect(() => {
        if (!isGameActive) {
            const interval = setInterval(() => {
                if (isGameActiveRef.current) return; // ゲームが開始されるまで降り続ける
                const x = Math.random() * 390;
                const randomSize =
                    moyashiSizes[
                        Math.floor(Math.random() * moyashiSizes.length)
                    ];
                const degree = Math.random() * (30 - 330) + 330;
                const radian = degree * (Math.PI / 180);

                const moyashi = Matter.Bodies.rectangle(
                    x,
                    0,
                    randomSize.width,
                    randomSize.height,
                    {
                        angle: radian,
                        render: {
                            fillStyle: "#ffffff",
                            strokeStyle: "#000000",
                            lineWidth: 2,
                        },
                    }
                );

                Matter.World.add(engineRef.current!.world, moyashi);
            }, 500);

            setMoyashiInterval(interval);
        }

        return () => {
            if (moyashiInterval) clearInterval(moyashiInterval);
        };
    }, [isGameActive]);

    const handleClick = (event: MouseEvent) => {
        console.log(countRef);
        console.log(fallenCountRef);
        console.log(scoreRef);
        if (!isGameActiveRef.current) return; // ゲームがアクティブでない場合は何もしない
        if (!renderRef.current || !engineRef.current) return;

        const canvas = renderRef.current.canvas;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        // クリック位置をキャンバス内の座標に変換
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        // 範囲外のクリックを無視
        if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return;

        // ランダムなサイズを選択
        const moyashiSizes = [
            { width: 6, height: 50 },
            { width: 6, height: 60 },
            { width: 6, height: 70 },
            { width: 7, height: 50 },
            { width: 7, height: 60 },
            { width: 7, height: 70 },
            { width: 8, height: 50 },
            { width: 8, height: 60 },
            { width: 8, height: 70 },
            { width: 9, height: 50 },
            { width: 9, height: 60 },
            { width: 9, height: 70 },
            { width: 10, height: 50 },
            { width: 10, height: 60 },
            { width: 10, height: 70 },
        ];

        const randomSize =
            moyashiSizes[Math.floor(Math.random() * moyashiSizes.length)];

        // 角度をランダムに設定
        const degree = Math.random() * (30 - 330) + 330;
        const radian = degree * (Math.PI / 180);

        // もやしを生成
        const moyashi = Matter.Bodies.rectangle(
            x,
            y,
            randomSize.width,
            randomSize.height,
            {
                angle: radian,
                render: {
                    fillStyle: "#ffffff",
                    strokeStyle: "#000000",
                    lineWidth: 2,
                },
            }
        );

        // もやしをWorldに追加
        Matter.World.add(engineRef.current!.world, moyashi);
        setCount((prev) => prev + 1); // カウントを増加
    };

    const startGame = () => {
        if (isGameActive) return;
        setIsGameActive(true);
        setCount(0);
        setFallenCount(0); // 落ちたもやしのカウントをリセット
        setScore(0);
        setTimeRemaining(10);

        // ランダムに降るもやしを止める
        if (moyashiInterval) clearInterval(moyashiInterval);

        // すべてのオブジェクトを削除、どんぶりは残す
        Matter.World.clear(engineRef.current!.world, true); // falseでどんぶり以外を削除

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (isGameActiveRef.current) {
                        isGameActiveRef.current = false;
                        setIsGameActive(false);
                        alert(
                            `タイムアップ！\nもやし数: ${countRef.current}\n落ちたもやし: ${fallenCountRef.current}\nトータルスコア: ${scoreRef.current}`
                        );
                    }
                }
                return prev - 1;
            });
        }, 1000);
    };

    return (
        <div>
            <div className={styles.container}>
                {!isGameActive && (
                    <>
                        <div className={styles.title}>マシマシモヤシ</div>
                        <button
                            className={styles.startButton}
                            onClick={startGame}
                        >
                            スタート
                        </button>
                    </>
                )}
                {isGameActive && (
                    <>
                        <div className={styles.counter}>もやし数: {count}</div>
                        <div className={styles.timer}>
                            残り時間: {timeRemaining}秒
                        </div>
                    </>
                )}
                <div ref={sceneRef} />
            </div>
        </div>
    );
};

export default Game;
