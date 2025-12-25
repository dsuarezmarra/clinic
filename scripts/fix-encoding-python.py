import codecs
import sys

def fix_double_encoded_utf8(text):
    """Fix text that was double-encoded as UTF-8"""
    try:
        # First decode as UTF-8 (which we already have), then encode as latin-1, then decode as UTF-8
        # This reverses the double-encoding
        return text.encode('latin-1').decode('utf-8')
    except (UnicodeDecodeError, UnicodeEncodeError):
        return text

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Try to fix the double-encoded portions
    fixed_content = fix_double_encoded_utf8(content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(fixed_content)
    
    print(f"Fixed: {filepath}")

if __name__ == "__main__":
    files = [
        r"c:\git\clinic\frontend\src\app\pages\agenda\calendar\calendar.component.ts",
    ]
    
    for filepath in files:
        try:
            process_file(filepath)
        except Exception as e:
            print(f"Error processing {filepath}: {e}")
