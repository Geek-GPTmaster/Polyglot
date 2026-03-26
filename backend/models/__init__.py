# Import all models to register them with SQLAlchemy metadata.
# Language must be imported first as other models have FKs to it.
from models.language import Language  # noqa: F401
from models.tag import Tag  # noqa: F401
from models.article import Article  # noqa: F401
from models.vocabulary import Vocabulary  # noqa: F401
from models.word_definition import WordDefinition  # noqa: F401
from models.save import Save  # noqa: F401
from models.app_settings import AppSetting  # noqa: F401
from models.review_log import ReviewLog  # noqa: F401
