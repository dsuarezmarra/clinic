# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""
Fix remaining double-encoded UTF-8 characters in calendar.component.ts
"""

filepath = r'c:\git\clinic\frontend\src\app\pages\agenda\calendar\calendar.component.ts'

with open(filepath, 'rb') as f:
    data = f.read()

# Map of corrupted byte sequences to correct UTF-8 bytes
replacements = [
    # ACTUALIZACIÓN (corrupted triple-encoding)
    (b'ACTUALIZACI\xc3\x83\xe2\x80\x9cN', b'ACTUALIZACI\xc3\x93N'),
    
    # Arrow/Reset emoji pattern (? or similar)
    (b'\xc3\xa2\xe2\x80\xa0\xc2\x90', b'\xe2\x86\x90'),  # ? left arrow (closest match)
    
    # TAMBIÉN EN ERROR pattern
    (b'TAMBI\xc3\x83\xe2\x80\xb0N', b'TAMBI\xc3\x89N'),
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
