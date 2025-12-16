import pytest

from app.agents.conversation import CHAT_INTENTS, ConversationalAgent


@pytest.mark.asyncio
async def test_chat_intents_contract_exists_and_is_well_formed():
    assert isinstance(CHAT_INTENTS, list) and CHAT_INTENTS, "CHAT_INTENTS must be a non-empty list"
    for intent in CHAT_INTENTS:
        assert "name" in intent and isinstance(intent["name"], str) and intent["name"], "intent.name required"
        assert "phrases" in intent and isinstance(intent["phrases"], list) and intent["phrases"], "intent.phrases required"
        assert "expects_any" in intent and isinstance(intent["expects_any"], list) and intent["expects_any"], "intent.expects_any required"


def _default_context() -> str:
    # Orchestrator currently passes a Python dict string with single quotes.
    return str(
        {
            "receipt": {
                "merchant": "Apple",
                "total": 999.99,
                "category": "Electronics",
                "eligibility": "APPROVED",
            },
            "recommendation": {
                "suggested": {"premium": 89.99, "coverage_period": "12 months"}
            },
            "policy": {"id": "abc12345"},
        }
    )


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "intent_name,phrase,expects_any",
    [
        (intent["name"], phrase, intent["expects_any"])
        for intent in CHAT_INTENTS
        for phrase in intent["phrases"]
    ],
)
async def test_every_phrase_is_recognized(intent_name: str, phrase: str, expects_any: list[str]):
    agent = ConversationalAgent()
    response = await agent.respond(phrase, context=_default_context())

    # Fail red if the phrase falls through to the generic unknown fallback.
    assert response and response.strip(), f"Empty response for intent={intent_name} phrase={phrase!r}"

    lowered = response.lower()
    # Minimal contract: response should contain at least one expected marker.
    assert any(marker.lower() in lowered for marker in expects_any), (
        f"Intent {intent_name} phrase {phrase!r} not handled as expected. "
        f"Expected one of {expects_any}, got: {response!r}"
    )


@pytest.mark.asyncio
async def test_context_total_is_used_when_asked():
    agent = ConversationalAgent()
    response = await agent.respond("what's my total?", context=_default_context())
    assert "999" in response or "$999" in response, f"Context total not reflected: {response!r}"


@pytest.mark.asyncio
async def test_context_policy_id_is_used_when_asked():
    agent = ConversationalAgent()
    response = await agent.respond("what's my policy id?", context=_default_context())
    assert "abc12345" in response, f"Context policy id not reflected: {response!r}"


@pytest.mark.asyncio
async def test_context_premium_is_used_when_asked():
    agent = ConversationalAgent()
    response = await agent.respond("what's my premium?", context=_default_context())
    assert "89.99" in response or "$89" in response, f"Context premium not reflected: {response!r}"
