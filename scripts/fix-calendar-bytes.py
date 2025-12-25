# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""
Fix double-encoded UTF-8 characters in calendar.component.ts
The file has characters that were encoded UTF-8 -> Latin-1 -> UTF-8 (triple encoded)
"""

filepath = r'c:\git\clinic\frontend\src\app\pages\agenda\calendar\calendar.component.ts'

with open(filepath, 'rb') as f:
    data = f.read()

# Map of corrupted byte sequences to correct UTF-8 bytes
replacements = [
    # Emoji: ?? (chart_with_upwards_trend)
    (b'\xc3\xb0\xc5\xb8\xe2\x80\x9c\xc5\xa0 ', '?? '.encode('utf-8')),
    
    # Emoji: ?? (package)
    (b'\xc3\xb0\xc5\xb8\xe2\x80\x9c\xc2\xa6', '??'.encode('utf-8')),
    
    # Emoji: ? (white_check_mark)
    (b'\xc3\xa2\xc5\x93\xe2\x80\xa6', '?'.encode('utf-8')),
    
    # Emoji: ?? (warning)
    (b'\xc3\xa2\xc5\xa1\xc2\xa0\xc3\xaf\xc2\xb8\xc2\x8f', '??'.encode('utf-8')),
    
    # Emoji: ? (x)
    (b'\xc3\xa2\xc2\x9d\xc5\x92', '?'.encode('utf-8')),
    
    # Emoji: ? (zap)
    (b'\xc3\xa2\xc5\xa1\xc2\xa1', '?'.encode('utf-8')),
    
    # Emoji: ?? (clock1) 
    (b'\xc3\xb0\xc5\xb8\xe2\x80\xa2\xc2\x90', '??'.encode('utf-8')),
    
    # Emoji: ?? (clipboard)
    (b'\xc3\xb0\xc5\xb8\xe2\x80\x9c\xe2\x80\xb9', '??'.encode('utf-8')),
    
    # Spanish characters: á
    (b'm\xc3\xa1s', 'más'.encode('utf-8')),
    
    # Spanish characters: é
    (b'qu\xc3\xa9', 'qué'.encode('utf-8')),
    
    # Spanish characters: ó
    (b'duraci\xc3\xb3n', 'duración'.encode('utf-8')),
    (b'validaci\xc3\xb3n', 'validación'.encode('utf-8')),
    
    # Spanish characters: ú
    (b'seg\xc3\xban', 'según'.encode('utf-8')),
    
    # Spanish characters: á (está)
    (b'est\xc3\xa1', 'está'.encode('utf-8')),
    
    # CREACIÓN - complex encoding
    (b'CREACI\xc3\x83\xe2\x80\x9cN', 'CREACIÓN'.encode('utf-8')),
]

original_size = len(data)
change_count = 0

for old_bytes, new_bytes in replacements:
    count = data.count(old_bytes)
    if count > 0:
        data = data.replace(old_bytes, new_bytes)
        print(f'Replaced {count} occurrence(s) of {old_bytes!r}')
        change_count += count

with open(filepath, 'wb') as f:
    f.write(data)

print(f'\nTotal replacements: {change_count}')
print(f'Original size: {original_size}, New size: {len(data)}')
print(f'File saved: {filepath}')
