# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""
Fix remaining double/triple-encoded UTF-8 characters in calendar.component.ts
"""

filepath = r'c:\git\clinic\frontend\src\app\pages\agenda\calendar\calendar.component.ts'

with open(filepath, 'rb') as f:
    data = f.read()

# Map of corrupted byte sequences to correct UTF-8 bytes
replacements = [
    # CAMBIÓ (triple-encoded Ó)
    (b'CAMBI\xc3\x83\xe2\x80\x9c', b'CAMBI\xc3\x93'),
    
    # × (multiplication sign) in "5×60m" pattern
    (b'5\xc3\x83\xe2\x80\x9460m', b'5\xc3\x9760m'),
    
    # × in sessions pattern
    (b'}\xc3\x83\xe2\x80\x94${unitMinutes}m', b'}\xc3\x97${unitMinutes}m'),
    
    # × in Bono pattern
    (b'X\xc3\x83\xe2\x80\x94Ym', b'X\xc3\x97Ym'),
    
    # ? (euro sign) pattern - corrupted euro signs
    (b'\xc3\xa2\xe2\x80\x9a\xc2\xac', b'\xe2\x82\xac'),  # ?
]

original_size = len(data)
change_count = 0

for old_bytes, new_bytes in replacements:
    if old_bytes == new_bytes:
        continue
    count = data.count(old_bytes)
    if count > 0:
        data = data.replace(old_bytes, new_bytes)
        print(f'Replaced {count} occurrence(s) of pattern')
        change_count += count

with open(filepath, 'wb') as f:
    f.write(data)

print(f'\nTotal replacements: {change_count}')
print(f'File saved: {filepath}')
