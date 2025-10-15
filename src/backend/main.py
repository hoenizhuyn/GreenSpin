from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from autogen import UserProxyAgent, AssistantAgent, GroupChat, GroupChatManager
import openai
import base64
import os
from dotenv import load_dotenv
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

class ProofAgent(AssistantAgent):
    def __init__(self, name="PhotoAgent", **kwargs):
        super().__init__(
            name=name,
            system_message=(
                "You are a vision assistant. You are given an image and your task is to describe what's in the image, "
                "especially focusing on environmental tasks or actions that might be happening. Do not make judgments yet — just describe clearly and concisely."
            ),
            llm_config={"config_list": [{"model": "gpt-4o"}]},
            **kwargs
        )

    def describe_image(self, base64_image, prompt="Describe the environmental activity in this image."):
        image_url = {
            "type": "image_url",
            "image_url": {
                "url": f"data:image/jpeg;base64,{base64_image}"
            }
        }

        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        image_url
                    ]
                }
            ],
            max_tokens=500
        )

        return response.choices[0].message.content

app = FastAPI()

# allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# agent config
task_creator = AssistantAgent(
    name="TaskCreatorAgent",
    system_message="You are an assistant that generates creative, impactful environmental tasks that individuals can carry out. These tasks should be actionable, measurable, and suitable for different levels of effort. The tasks should be feasible within one week.",
    llm_config={"config_list": [{"model": "gpt-4"}]},
)

task_rater = AssistantAgent(
    name="TaskRaterAgent",
    system_message="You are an expert in environmental economics. You receive a task description and estimate its value in euros. The estimation should be between 5 and 20 Euros."
                   "Respond in the format:\n"
                   "'Estimated value: €X.XX\nDescription: <Short economic rationale>'",
    llm_config={"config_list": [{"model": "gpt-4"}]},
)

validation_agent = AssistantAgent(
    name="ValidationAgent",
    system_message="You are a strict environmental task validator. When given task completion evidence (text, image description, video description), "
                   "determine if the task was completed properly. Respond with:\n"
                   "'Task completed' or 'Task not completed' and give a brief justification.",
    llm_config={"config_list": [{"model": "gpt-4"}]},
)

# models for data transfer
class Proof(BaseModel):
    task: str
    proof: str

@app.get("/api/create-task")
async def create_task():
    client = UserProxyAgent(name="Client", human_input_mode="NEVER", code_execution_config={"use_docker": False})
    chat = GroupChat(agents=[client, task_creator, task_rater], messages=[], max_round=3)
    manager = GroupChatManager(groupchat=chat, llm_config={"config_list": [{"model": "gpt-4"}]})

    client.initiate_chat(manager, message="Generate a weekly environmental task and estimate its value.")

    value = chat.messages[2]["content"].split("\n")
    updated_value = int(float(value[0].replace('Estimated value: €', '')))

    return {"desc": chat.messages[1]["content"], "task": value[1], "value": value[0], "points": updated_value}

@app.post("/api/validate-task")
async def validate_task(task: str = Form(...), proof: str = Form(""), photo: UploadFile = File(None)):
    # Analyse the given picture
    proof_agent = ProofAgent()

    photo_bytes = await photo.read()
    photo_b64 = base64.b64encode(photo_bytes).decode()
    media_description = proof_agent.describe_image(photo_b64)
    #print(media_description)

    full_proof = proof
    full_proof += f"\n\nExtracted Media Description:\n{media_description}"

    client = UserProxyAgent(name="Client", human_input_mode="NEVER", code_execution_config={"use_docker": False})
    chat = GroupChat(agents=[client, validation_agent], messages=[], max_round=2, speaker_selection_method="round_robin")
    manager = GroupChatManager(groupchat=chat, llm_config={"config_list": [{"model": "gpt-4"}]})

    msg = f"Task: {task}\n\nUser Proof: {full_proof}"
    client.initiate_chat(manager, message=msg)


    result = chat.messages[1]["content"]
    return {"result": result}
