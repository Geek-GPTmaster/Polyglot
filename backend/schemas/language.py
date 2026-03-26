from pydantic import BaseModel


class LanguageRead(BaseModel):
    code: str
    name: str
    native_name: str
    is_active: bool

    model_config = {"from_attributes": True}
