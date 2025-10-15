import React, {useState} from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Textarea} from "@/components/ui/textarea";
import {Progress} from "@/components/ui/progress";
import wheelImage from "@/assets/wheel.png";
import clsx from "clsx";
import {ModeToggle} from "@/components/mode-toggle.tsx";
import {Skeleton} from "@/components/ui/skeleton";


const GreenSpin: React.FC = () => {
    const [desc, setDesc] = useState<string | null>(null);
    const [task, setTask] = useState<string | null>(null);
    const [taskPoints, setTaskPoints] = useState<number | null>(null);
    const [taskValue, setTaskValue] = useState<string | null>(null);
    const [taskProof, setTaskProof] = useState("");
    const [validationResult, setValidationResult] = useState<string | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [taskPhoto, setTaskPhoto] = useState<File | null>(null);

    async function generateTask() {
        try {
            setIsSpinning(true);
            const res = await fetch("http://localhost:8000/api/create-task");
            const data = await res.json();

            // Stop spinning after 3 seconds
            setTimeout(() => {
                setIsSpinning(false);
                setDesc(data.desc);
                setTask(data.task);
                setTaskPoints(data.points);
                setTaskValue(data.value);
                setValidationResult(null);
                setTaskProof("");
            }, 3000);
        } catch (error) {
            console.error("Error generating task:", error);
            setIsSpinning(false);
        }
    }

    async function validateTask() {
        try {
            const formData = new FormData();
            formData.append("task", desc ?? "");
            formData.append("proof", taskProof);

            if (taskPhoto) {
                formData.append("photo", taskPhoto);
            }

            const res = await fetch("http://localhost:8000/api/validate-task", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            setValidationResult(data.result);
        } catch (error) {
            console.error("Error validating task:", error);
        }
    }


    return (
        <main className="p-6 max-w-6xl mx-auto space-y-10">
            <div className="flex flex-col md:flex-row md:items-start md:gap-10">
                {/* Left: Text and Tasks */}
                <div className="space-y-6 flex-1">
                    <h1 className="text-4xl font-bold">🎡 GreenSpin Weekly Challenge</h1>
                    <p className="text-muted-foreground">Take on meaningful eco-tasks and earn rewards weekly.</p>
                    <Button onClick={generateTask}>🎯 Spin for New Task</Button>

                    {isSpinning ? (
                        <Card>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-6 w-3/4"/>
                                <Skeleton className="h-4 w-full"/>
                                <Skeleton className="h-4 w-1/2"/>
                                <Skeleton className="h-2 w-full"/>
                            </CardContent>
                        </Card>
                    ) : (
                        task && (
                            <Card>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h2 className="text-xl font-semibold">📝 Assigned Task</h2>
                                        <p>{desc}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {taskPoints !== null && <p>🎁 <strong>{taskPoints}</strong> Points</p>}
                                        {taskValue && <p>💶 <strong>{taskValue}</strong></p>}
                                    </div>
                                    <Progress value={taskPoints ?? 0} className="h-2"/>
                                </CardContent>
                            </Card>
                        )
                    )}

                    {isSpinning ? (
                        <Card>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-6 w-3/4"/>
                                <Skeleton className="h-4 w-full"/>
                                <Skeleton className="h-4 w-1/2"/>
                                <Skeleton className="h-2 w-full"/>
                            </CardContent>
                        </Card>
                    ) : (
                        task && (
                            <Card>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h2 className="text-xl font-semibold">🌲 Environmental impact</h2>
                                        <p>{task}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    )}

                    {isSpinning ? (
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-1/3"/>
                            <Skeleton className="h-24 w-full rounded-md"/>
                            <Skeleton className="h-10 w-40 rounded-md"/>
                        </div>
                    ) : (
                        task && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-medium">📤 Submit Your Task Proof</h2>
                                <Textarea
                                    placeholder="Describe your result here!"
                                    value={taskProof}
                                    onChange={(e) => setTaskProof(e.target.value)}
                                />
                                <div className="flex flex-col gap-4">
                                    <label className="block">
                                        📸 Upload Photo Proof
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) setTaskPhoto(e.target.files[0]);
                                            }}
                                            className="mt-1 block w-full text-sm text-gray-700"
                                        />
                                    </label>
                                </div>
                                <Button
                                    onClick={validateTask}
                                    disabled={
                                        !taskProof.trim() || !taskPhoto
                                    }
                                >
                                    ✅ Submit for Validation
                                </Button>
                                {validationResult && (
                                    <div className="text-sm text-foreground mt-2">
                                        🔍 <strong>Validation Result:</strong> {validationResult}
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>
                {/* Right: Spinning Wheel */}
                <div className="mt-10 md:mt-0 md:w-64 flex justify-center items-center">
                    <div className="relative w-48 h-48">
                        <img
                            src={wheelImage}
                            alt="Spinning Wheel"
                            className={clsx(
                                "w-full h-full object-contain rounded-full transition-transform duration-1000",
                                isSpinning && "animate-spin-slow"
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Resources */}
            <div className="space-y-4">
                <h2 className="text-lg font-medium">📚 Additional Resources</h2>
                <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="space-y-2">
                            <h3 className="font-semibold">🌍 Volunteer</h3>
                            <p>Join the community volunteer program to gain value and help others.</p>
                            <Button className="w-full">View Details</Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="space-y-2">
                            <h3 className="font-semibold">📘 Task Guide</h3>
                            <p>Learn best practices for completing your task efficiently.</p>
                            <Button className="w-full">Download</Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="space-y-2">
                            <h3 className="font-semibold">🚀 Productivity Tips</h3>
                            <p>Discover weekly updated insights to boost your workflow.</p>
                            <Button className="w-full">Read More</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Dark Mode Toggle at Bottom */}
            <div className="fixed bottom-4 right-4 z-50">
                <ModeToggle/>
            </div>

        </main>
    );
};

export default GreenSpin;
