import json
from pydantic import BaseModel, model_validator


class WordDefinitionRead(BaseModel):
    word: str
    language_code: str
    phonetics: str | None
    part_of_speech: str | None
    definition: str | None
    example: str | None
    synonyms: list[str]

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def parse_synonyms(cls, values):
        # synonyms is stored as a JSON string in DB; deserialize to list
        if hasattr(values, "__dict__"):
            raw = getattr(values, "synonyms", None)
        elif isinstance(values, dict):
            raw = values.get("synonyms")
        else:
            return values

        if isinstance(raw, str):
            try:
                parsed = json.loads(raw)
                if isinstance(values, dict):
                    values["synonyms"] = parsed
                else:
                    object.__setattr__(values, "synonyms", parsed)
            except (json.JSONDecodeError, TypeError):
                if isinstance(values, dict):
                    values["synonyms"] = []
                else:
                    object.__setattr__(values, "synonyms", [])
        elif raw is None:
            if isinstance(values, dict):
                values["synonyms"] = []
            else:
                object.__setattr__(values, "synonyms", [])
        return values
