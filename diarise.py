import torch
from pyannote.audio.pipelines.utils.hook import ProgressHook
import librosa

def diarise(file_path: str, pipeline_instance):

    # Load audio using librosa and process to support all file types
    waveform, sample_rate = librosa.load(file_path, sr=None, mono=False)

    if waveform.ndim == 1:
        waveform = waveform[None, :]

    waveform = torch.from_numpy(waveform).float()

    audio = {
        "waveform": waveform,
        "sample_rate": sample_rate
    }

    with ProgressHook() as hook:
        output = pipeline_instance(audio, hook=hook) 

    return output