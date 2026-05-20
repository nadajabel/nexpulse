import sys
from gtts import gTTS

if len(sys.argv) < 3:
    print("Usage: python tts_generator.py <text> <output>")
    sys.exit(1)

text = sys.argv[1]
output = sys.argv[2]

tts = gTTS(text=text, lang="fr")
tts.save(output)

print(output)