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
    const [isGameActive, setIsGameActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(10);
    const isGameActiveRef = useRef(isGameActive);
    let timerInterval: NodeJS.Timeout;

    useEffect(() => {
        countRef.current = count;
    }, [count]);

    // 最新の isGameActive を ref に反映
    useEffect(() => {
        isGameActiveRef.current = isGameActive;
    }, [isGameActive]);

    // Matter.js のセットアップ（初回のみ実行）
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

        // どんぶりの形状
        const bowl = Matter.Bodies.fromVertices(
            195,
            694,
            [
                [
                    { x: 100, y: 700 }, // 左下
                    { x: 80, y: 600 }, // 左カーブ
                    { x: 70, y: 500 }, // 左上（カーブの開始）
                    { x: 160, y: 500 }, // 中央より左（カーブの下部）
                    { x: 230, y: 500 }, // 中央より右（カーブの下部）
                    { x: 320, y: 500 }, // 右上（カーブの終了）
                    { x: 310, y: 600 }, // 右カーブ
                    { x: 290, y: 700 }, // 右下
                    { x: 250, y: 750 }, // 高台右
                    { x: 150, y: 750 }, // 高台左
                ],
            ],
            {
                isStatic: true, // 🔹 どんぶりを固定する
                restitution: 0, // 反発係数をゼロに（跳ねないようにする）
                friction: 1, // 摩擦を高める（動きにくくする）
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

        // 奈落落下時
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
                }
            });
        });

        // クリックイベントリスナー登録
        render.canvas.addEventListener("click", handleClick);

        return () => {
            render.canvas.removeEventListener("click", handleClick);
            Matter.Render.stop(render);
            Matter.World.clear(engine.world, true);
            Matter.Engine.clear(engine);
            Matter.Runner.stop(runner);

            // 🔹 変数を `null` にして次回の `useEffect` 実行時に再初期化されるようにする
            renderRef.current = null;
            engineRef.current = null;
            runnerRef.current = null;
        };
    }, []);

    // クリックイベントハンドラ（キャンバス上で発火する）
    const handleClick = (event: MouseEvent) => {
        if (!isGameActiveRef.current) return;
        if (!renderRef.current || !engineRef.current) return;

        const canvas = renderRef.current.canvas;
        const rect = canvas.getBoundingClientRect();

        // 💡 本来の描画サイズでスケール補正
        const scaleX = canvas.width / rect.width; // 横方向のスケール
        const scaleY = canvas.height / rect.height; // 縦方向のスケール

        // 補正後の正しい座標を計算
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return;

        const moyashiSizes = [
            { width: 10, height: 40 },
            { width: 15, height: 50 },
            { width: 12, height: 45 },
        ];

        // ランダムでサイズを選択
        const randomSize =
            moyashiSizes[Math.floor(Math.random() * moyashiSizes.length)];

        const moyashi = Matter.Bodies.rectangle(
            x,
            y,
            randomSize.width,
            randomSize.height,
            {
                render: {
                    fillStyle: "#ffffff",
                    strokeStyle: "#000000",
                    lineWidth: 2,
                },
            }
        );

        Matter.World.add(engineRef.current.world, moyashi);
        setCount((prev) => prev + 1);
    };

    const startGame = () => {
        if (isGameActive) return;
        setIsGameActive(true);
        setCount(0);
        setTimeRemaining(10);

        // 🔹 タイマー変数を useRef で管理（複数回発火防止）
        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (isGameActiveRef.current) {
                        isGameActiveRef.current = false;
                        setIsGameActive(false);
                        setCount(0);
                        Matter.World.clear(engineRef.current!.world, true);
                        alert(`タイムアップ！もやし数: ${countRef.current}`); // 🔹 最新の `count` を取得
                    }
                    return 10;
                }
                return prev - 1;
            });
        }, 1000);

        timerInterval = timer; // 🔹 グローバル変数にセット
    };

    return (
        <div>
            <div className={styles.container}>
                <div className={styles.counter}>もやし数: {count}</div>
                {!isGameActive && (
                    <button className={styles.startButton} onClick={startGame}>
                        スタート
                    </button>
                )}
                <div className={styles.timer}>残り時間: {timeRemaining}秒</div>
                <div ref={sceneRef} /> {/* 1つだけ canvas が描画される */}
            </div>
        </div>
    );
};

export default Game;
