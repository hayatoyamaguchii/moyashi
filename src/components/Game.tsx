import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import decomp from "poly-decomp";

Matter.Common.setDecomp(decomp);

const Game = () => {
    const sceneRef = useRef<HTMLDivElement>(null);
    const [count, setCount] = useState(0);

    useEffect(() => {
        const engine = Matter.Engine.create();
        const render = Matter.Render.create({
            element: sceneRef.current!,
            engine: engine,
            options: {
                width: 390,
                height: 844,
                background: "#f8f1e4",
                wireframes: false,
            },
        });

        const bowl = Matter.Bodies.rectangle(195, 700, 200, 40, {
            isStatic: true,
            render: { fillStyle: "brown" },
        });

        const leftWall = Matter.Bodies.rectangle(-10, 422, 20, 844, {
            isStatic: true,
            render: { visible: false },
        });
        const rightWall = Matter.Bodies.rectangle(400, 422, 20, 844, {
            isStatic: true,
            render: { visible: false },
        });
        const bottomSensor = Matter.Bodies.rectangle(195, 820, 390, 20, {
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

        let moyashiList: Matter.Body[] = [];

        const handleClick = (event: MouseEvent) => {
            const rect = render.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;

            const moyashi = Matter.Bodies.rectangle(x, y, 10, 40, {
                render: { fillStyle: "#ffffff" },
            });

            moyashiList.push(moyashi);
            Matter.World.add(engine.world, moyashi);
            setCount(moyashiList.length);
        };

        document.addEventListener("click", handleClick);

        const runner = Matter.Runner.create();
        Matter.Runner.run(runner, engine);
        Matter.Render.run(render);

        return () => {
            document.removeEventListener("click", handleClick);
            Matter.Render.stop(render);
            Matter.World.clear(engine.world);
            Matter.Engine.clear(engine);
        };
    }, []);

    return (
        <div>
            <div>もやし数: {count}</div>
            <div ref={sceneRef} />
        </div>
    );
};

export default Game;
