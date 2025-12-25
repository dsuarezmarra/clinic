# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""
Fix mixed encoding (Latin-1/UTF-8) in all TypeScript and HTML files
Converts Latin-1 single-byte characters to proper UTF-8 sequences
"""

import os
import glob

base_path = r'c:\git\clinic\frontend\src'

# Map of Latin-1 single bytes to UTF-8 equivalents
latin1_to_utf8 = {
    b'\xe1': b'\xc3\xa1',  # á
    b'\xe9': b'\xc3\xa9',  # é
    b'\xed': b'\xc3\xad',  # í
    b'\xf3': b'\xc3\xb3',  # ó
    b'\xfa': b'\xc3\xba',  # ú
    b'\xf1': b'\xc3\xb1',  # ñ
    b'\xc1': b'\xc3\x81',  # Á
    b'\xc9': b'\xc3\x89',  # É
    b'\xcd': b'\xc3\x8d',  # Í
    b'\xd3': b'\xc3\x93',  # Ó
    b'\xda': b'\xc3\x9a',  # Ú
    b'\xd1': b'\xc3\x91',  # Ñ
    b'\xbf': b'\xc2\xbf',  # ¿
    b'\xa1': b'\xc2\xa1',  # ¡
    b'\xd7': b'\xc3\x97',  # ×
    b'\xfc': b'\xc3\xbc',  # ü
    b'\xdc': b'\xc3\x9c',  # Ü
}

def fix_file(filepath):
    """Fix a single file, converting Latin-1 bytes to UTF-8"""
    with open(filepath, 'rb') as f:
        data = f.read()
    
    result = bytearray()
    i = 0
    changes = 0
    
    while i < len(data):
        byte = data[i:i+1]
        first = data[i]
        
        # ASCII (0x00-0x7F)
        if first < 0x80:
            result.extend(byte)
            i += 1
            continue
        
        # Valid UTF-8 2-byte sequence (C2-DF followed by 80-BF)
        if 0xC2 <= first <= 0xDF and i + 1 < len(data) and 0x80 <= data[i+1] <= 0xBF:
            result.extend(data[i:i+2])
            i += 2
            continue
        
        # Valid UTF-8 3-byte sequence (E0-EF followed by two 80-BF)
        if 0xE0 <= first <= 0xEF and i + 2 < len(data) and 0x80 <= data[i+1] <= 0xBF and 0x80 <= data[i+2] <= 0xBF:
            result.extend(data[i:i+3])
            i += 3
            continue
        
        # Valid UTF-8 4-byte sequence (F0-F7 followed by three 80-BF)
        if 0xF0 <= first <= 0xF7 and i + 3 < len(data) and 0x80 <= data[i+1] <= 0xBF and 0x80 <= data[i+2] <= 0xBF and 0x80 <= data[i+3] <= 0xBF:
            result.extend(data[i:i+4])
            i += 4
            continue
        
        # Otherwise, this is a Latin-1 character that needs conversion
        if byte in latin1_to_utf8:
            result.extend(latin1_to_utf8[byte])
            changes += 1
        else:
            # Unknown byte, keep as-is but log it
            result.extend(byte)
        i += 1
    
    if changes > 0:
        with open(filepath, 'wb') as f:
            f.write(result)
    
    return changes

# Find all TypeScript and HTML files
files = glob.glob(base_path + r'\**\*.ts', recursive=True)
files += glob.glob(base_path + r'\**\*.html', recursive=True)

total_changes = 0
fixed_files = 0

for filepath in files:
    try:
        changes = fix_file(filepath)
        if changes > 0:
            rel_path = filepath.replace(base_path + os.sep, '')
            print(f'Fixed {changes} characters in {rel_path}')
            total_changes += changes
            fixed_files += 1
    except Exception as e:
        rel_path = filepath.replace(base_path + os.sep, '')
        print(f'Error processing {rel_path}: {e}')

print(f'\nTotal: {total_changes} characters fixed in {fixed_files} files')
