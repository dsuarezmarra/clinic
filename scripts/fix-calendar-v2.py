# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""
Fix double-encoded UTF-8 characters in calendar.component.ts
"""

filepath = r'c:\git\clinic\frontend\src\app\pages\agenda\calendar\calendar.component.ts'

with open(filepath, 'rb') as f:
    data = f.read()

# Map of corrupted byte sequences to correct UTF-8 bytes
# Using hex escapes for everything to avoid encoding issues
replacements = [
    # Emoji: chart (??)
    (b'\xc3\xb0\xc5\xb8\xe2\x80\x9c\xc5\xa0 ', b'\xf0\x9f\x93\x8a '),
    
    # Emoji: package (??)
    (b'\xc3\xb0\xc5\xb8\xe2\x80\x9c\xc2\xa6', b'\xf0\x9f\x93\xa6'),
    
    # Emoji: checkmark (?)
    (b'\xc3\xa2\xc5\x93\xe2\x80\xa6', b'\xe2\x9c\x85'),
    
    # Emoji: warning (??)
    (b'\xc3\xa2\xc5\xa1\xc2\xa0\xc3\xaf\xc2\xb8\xc2\x8f', b'\xe2\x9a\xa0\xef\xb8\x8f'),
    
    # Emoji: x (?) - need to find correct corrupted bytes
    (b'\xc3\xa2\xc2\x9d\xc5\x92', b'\xe2\x9d\x8c'),
    
    # Emoji: zap (?)
    (b'\xc3\xa2\xc5\xa1\xc2\xa1', b'\xe2\x9a\xa1'),
    
    # Emoji: clock (??) 
    (b'\xc3\xb0\xc5\xb8\xe2\x80\xa2\xc2\x90', b'\xf0\x9f\x95\x90'),
    
    # Emoji: clipboard (??)
    (b'\xc3\xb0\xc5\xb8\xe2\x80\x9c\xe2\x80\xb9', b'\xf0\x9f\x93\x8b'),
    
    # Spanish: mas -> más
    (b'm\xc3\xa1s', b'm\xc3\xa1s'),  # Already correct, skip
    
    # Spanish: que -> qué  
    (b'qu\xc3\xa9', b'qu\xc3\xa9'),  # Already correct, skip
    
    # CREACIÓN - complex encoding
    (b'CREACI\xc3\x83\xe2\x80\x9cN', b'CREACI\xc3\x93N'),
]

original_size = len(data)
change_count = 0

for old_bytes, new_bytes in replacements:
    if old_bytes == new_bytes:
        continue
    count = data.count(old_bytes)
    if count > 0:
        data = data.replace(old_bytes, new_bytes)
        print(f'Replaced {count} occurrence(s)')
        change_count += count

with open(filepath, 'wb') as f:
    f.write(data)

print(f'\nTotal replacements: {change_count}')
print(f'Original size: {original_size}, New size: {len(data)}')
print(f'File saved: {filepath}')
