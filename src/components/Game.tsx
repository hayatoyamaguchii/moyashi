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
    const fallenCountRef = useRef(0); // UI には表示しないので useRef のみ使用
    const [isGameActive, setIsGameActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(10);
    const isGameActiveRef = useRef(isGameActive);

    useEffect(() => {
        countRef.current = count;
    }, [count]);

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
                    fallenCountRef.current += 1; // 画面には表示しないので useState は不要
                }
            });
        });

        render.canvas.addEventListener("click", handleClick);

        return () => {
            render.canvas.removeEventListener("click", handleClick);
            Matter.Render.stop(render);
            Matter.World.clear(engine.world, true);
            Matter.Engine.clear(engine);
            Matter.Runner.stop(runner);

            renderRef.current = null;
            engineRef.current = null;
            runnerRef.current = null;
        };
    }, []);

    const handleClick = (event: MouseEvent) => {
        if (!isGameActiveRef.current) return;
        if (!renderRef.current || !engineRef.current) return;

        const canvas = renderRef.current.canvas;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return;

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

        const degree = Math.random() * (30 - 330) + 330;
        const radian = degree * (Math.PI / 180);

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

        Matter.World.add(engineRef.current!.world, moyashi);
        setCount((prev) => prev + 1);
    };

    const startGame = () => {
        if (isGameActive) return;
        setIsGameActive(true);
        setCount(0);
        fallenCountRef.current = 0; // 落ちたもやしのカウントをリセット
        setTimeRemaining(10);

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (isGameActiveRef.current) {
                        isGameActiveRef.current = false;
                        setIsGameActive(false);
                        Matter.World.clear(engineRef.current!.world, true);
                        alert(
                            `タイムアップ！\nもやし数: ${countRef.current}\n落ちたもやし: ${fallenCountRef.current}`
                        );
                    }
                    return 10;
                }
                return prev - 1;
            });
        }, 1000);
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
                <div ref={sceneRef} />
            </div>
        </div>
    );
};

export default Game;
