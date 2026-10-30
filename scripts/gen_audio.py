"""Vygeneruje nahrávky výslovnosti do audio/ a mapu js/audio.js.

Hlas: Open JTalk + HTS voice "Mei" (pyopenjtalk-plus, CC BY 3.0).

Použití:
    pip install pyopenjtalk-plus
    node scripts/audio-texts.js > texts.json
    python scripts/gen_audio.py texts.json
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import wave

import numpy as np
import pyopenjtalk

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
AUDIO_DIR = os.path.join(ROOT, 'audio')
SR = 48000


def norm(s):
    return re.sub(r'[\s、。．，,.!?！？’\']', '', s)


def njd_read(text):
    return norm(''.join(n['read'] for n in pyopenjtalk.run_frontend(text)))


def pron(text):
    return norm(''.join(n['pron'] for n in pyopenjtalk.run_frontend(text)))


def pick(entry):
    # první kandidát, jehož čtení odpovídá kaně (tj. kanji nezmění výslovnost)
    target = norm(entry['read'])
    for c in entry['cands']:
        if njd_read(c) == target:
            return c, True
    return entry['cands'][-1], False


def trim(x, thr=0.01, pad=0.06):
    idx = np.where(np.abs(x) > thr * np.max(np.abs(x)))[0]
    if not len(idx):
        return x
    p = int(pad * SR)
    return x[max(0, idx[0] - p): idx[-1] + p]


def synth(text, out_mp3):
    x, sr = pyopenjtalk.tts(text)
    x = trim(x.astype(np.float64))
    x = x / max(1e-9, np.max(np.abs(x))) * 0.89 * 32767
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        tmp = f.name
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(x.astype(np.int16).tobytes())
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', tmp, '-ac', '1', '-ar', '24000',
                    '-codec:a', 'libmp3lame', '-b:a', '48k', out_mp3], check=True)
    os.unlink(tmp)


def main():
    entries = json.load(open(sys.argv[1], encoding='utf-8'))
    os.makedirs(AUDIO_DIR, exist_ok=True)
    mapping, report = {}, []
    for e in entries:
        text, ok = pick(e)
        name = hashlib.sha1(e['say'].encode('utf-8')).hexdigest()[:10]
        synth(text, os.path.join(AUDIO_DIR, name + '.mp3'))
        mapping[e['say']] = name
        report.append(f"{'  ' if ok else '! '}{e['say']}\t{text}\t{pron(text)}")

    # tiché „odemykací“ audio pro iOS
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        tmp = f.name
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(np.zeros(int(0.1 * SR), dtype=np.int16).tobytes())
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', tmp, '-ac', '1', '-ar', '24000',
                    '-codec:a', 'libmp3lame', '-b:a', '32k', os.path.join(AUDIO_DIR, 'silence.mp3')], check=True)
    os.unlink(tmp)

    with open(os.path.join(ROOT, 'js', 'audio.js'), 'w', encoding='utf-8') as f:
        f.write('/* Vygenerováno skriptem scripts/gen_audio.py – needitovat ručně.\n'
                ' * Nahrávky: Open JTalk, HTS voice "Mei" © Nagoya Institute of Technology (CC BY 3.0). */\n')
        f.write('const AUDIO = ' + json.dumps(mapping, ensure_ascii=False, indent=0) + ';\n')
    print('\n'.join(report))
    print(f'\n{len(mapping)} nahrávek', file=sys.stderr)


if __name__ == '__main__':
    main()
