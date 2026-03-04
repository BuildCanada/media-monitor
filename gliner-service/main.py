from fastapi import FastAPI
from pydantic import BaseModel
from gliner2 import GLiNER2

app = FastAPI()
model = None

TOPIC_LABELS = [
    "politics", "economy", "business", "technology", "health",
    "environment", "education", "immigration", "housing",
    "energy", "infrastructure", "defence", "indigenous affairs",
    "agriculture", "trade", "law", "crime", "culture", "sports",
]


class ExtractRequest(BaseModel):
    text: str
    title: str = ""


class Entity(BaseModel):
    value: str
    confidence: float


class ExtractResponse(BaseModel):
    people: list[Entity]
    organizations: list[Entity]
    locations: list[Entity]
    topics: list[Entity]


@app.on_event("startup")
async def load_model():
    global model
    model = GLiNER2.from_pretrained("fastino/gliner2-base-v1")


@app.post("/extract", response_model=ExtractResponse)
async def extract(req: ExtractRequest):
    combined = f"{req.title}\n\n{req.text}" if req.title else req.text

    # NER extraction
    entities = model.extract_entities(
        combined,
        ["person", "organization", "location"],
    )

    people = []
    organizations = []
    locations = []

    for ent in entities:
        item = Entity(value=ent["text"], confidence=round(ent["score"], 3))
        if ent["label"] == "person":
            people.append(item)
        elif ent["label"] == "organization":
            organizations.append(item)
        elif ent["label"] == "location":
            locations.append(item)

    # Topic classification
    topic_result = model.classify_text(
        combined,
        {"topics": {"labels": TOPIC_LABELS, "multi_label": True}},
    )

    topics = []
    if "topics" in topic_result:
        for label, score in topic_result["topics"].items():
            if score > 0.3:
                topics.append(Entity(value=label, confidence=round(score, 3)))

    # Deduplicate by value (keep highest confidence)
    people = _dedup(people)
    organizations = _dedup(organizations)
    locations = _dedup(locations)

    return ExtractResponse(
        people=people,
        organizations=organizations,
        locations=locations,
        topics=topics,
    )


def _dedup(entities: list[Entity]) -> list[Entity]:
    seen: dict[str, Entity] = {}
    for ent in entities:
        key = ent.value.lower()
        if key not in seen or ent.confidence > seen[key].confidence:
            seen[key] = ent
    return list(seen.values())


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": model is not None}
