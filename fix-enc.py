# -*- coding: utf-8 -*-
import re

with open('frontend/src/app/pages/agenda/calendar/calendar.component.ts', 'rb') as f:
    content = f.read()

text = content.decode('utf-8')

# Replacements using hex sequences to avoid encoding issues
replacements = [
    # Emojis - longer patterns first
    (b'\xc3\xb0\xc5\xb8\xe2\x80\x9c\xc5'.decode('utf-8'), '\U0001F4CA'),  # chart emoji
    (b'\xc3\xb0\xc5\xb8\xe2\x80\x9c\xc2\xa6'.decode('utf-8'), '\U0001F4E6'),  # package emoji
    (b'\xc3\xa2\xc5\x93\xe2\x80\xa6'.decode('utf-8'), '\u2705'),  # checkmark
    (b'\xc3\xa2\xc5\xa1\xc2\xa0\xc3\xaf\xc2\xb8\xc2\x8f'.decode('utf-8'), '\u26A0\uFE0F'),  # warning
    (b'\xc3\xa2\xc2\x8f\xc5\x92'.decode('utf-8'), '\u274C'),  # X mark
    (b'\xc3\xb0\xc5\xb8\xe2\x80\xa2\xc2\x8f'.decode('utf-8'), '\U0001F550'),  # clock
    (b'\xc3\xb0\xc5\xb8\xe2\x80\x9c\xe2\x80\xb9'.decode('utf-8'), '\U0001F4CB'),  # clipboard
    (b'\xc3\xa2\xc5\xa1\xc2\xa1'.decode('utf-8'), '\u26A1'),  # lightning
    (b'\xc3\xa2\xe2\x80\xa0\xc2\xa9'.decode('utf-8'), '\u21A9'),  # return arrow
    # Patterns
    (b'CREACI\xc3\x83\xc2\xa2\xe2\x82\xac\xc5\x93N'.decode('utf-8'), 'CREACION'),
    (b'ACTUALIZACI\xc3\x83\xc2\xa2\xe2\x82\xac\xc5\x93N'.decode('utf-8'), 'ACTUALIZACION'),
    # Accented vowels
    (b'\xc3\x83\xc2\xa1'.decode('utf-8'), 'a'),  # a acute
    (b'\xc3\x83\xc2\xa9'.decode('utf-8'), 'e'),  # e acute
    (b'\xc3\x83\xc2\xad'.decode('utf-8'), 'i'),  # i acute
    (b'\xc3\x83\xc2\xb3'.decode('utf-8'), 'o'),  # o acute
    (b'\xc3\x83\xc2\xba'.decode('utf-8'), 'u'),  # u acute
    (b'\xc3\x83\xc2\xb1'.decode('utf-8'), 'n'),  # n tilde
    # Punctuation
    (b'\xc2\xa2\xc2\xbf'.decode('utf-8'), '?'),
    (b'\xc2\xa2\xc2\xa1'.decode('utf-8'), '!'),
    # Replacement char
    (b'\xc3\xaf\xc2\xbf\xc2\xbd'.decode('utf-8'), ''),
]

count = 0
for old, new in replacements:
    matches = text.count(old)
    if matches > 0:
        text = text.replace(old, new)
        count += matches
        print(f'Replaced {matches}x')

print(f'Total: {count}')

with open('frontend/src/app/pages/agenda/calendar/calendar.component.ts', 'w', encoding='utf-8') as f:
    f.write(text)
print('Done')
