import { downloadBlob, getPublicPathFor } from '../../utils';
import Recorder from 'recorderjs';

export class MediaRecorderService {
    public recorder: any;
    public stream?: MediaStream;
    public audioContext?: AudioContext;
    public analyserNode?: AnalyserNode;
    public gainNode?: GainNode;

    playTestInput(deviceId: string) {
        this.audioContext = new AudioContext();
        this.gainNode = this.audioContext.createGain();
        this.analyserNode = this.audioContext.createAnalyser();

        this.initStream(deviceId).then(() => {
            const source = this.audioContext!.createMediaStreamSource(this.stream!);
            source.connect(this.gainNode!);
            this.gainNode!.connect(this.analyserNode!);
            this.analyserNode!.connect(this.audioContext!.destination);
        });
    }

    stopTestInput() {
        if (!this.audioContext) {
            return;
        }
        this.audioContext?.close();
        delete this.audioContext;
        this.closeStream();
    }

    async initStream(deviceId: string) {
        const recordConstraints = {
            // Try to set the best recording params for ripping the audio tracks
            autoGainControl: false,
            channelCount: 2,
            deviceId: deviceId,
            echoCancellation: false,
            noiseSuppression: false,
            sampleRate: { min: 44100, max: 44100, ideal: 44100 }, // CAVEAT: it looks like this is the only way to get 44100Hz as sampling rate for some devices in chrome
            highpassFilter: false,
        };

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: recordConstraints });
        } catch (err) {
            if (err instanceof OverconstrainedError && err.constraint === 'sampleRate') {
                console.log('Cannot obtain a sampleRate of 44100Hz. Falling back to default value...');
                this.stream = await navigator.mediaDevices.getUserMedia({ audio: { ...recordConstraints, sampleRate: undefined } }); // fallback to default sampleRate
            } else {
                throw err;
            }
        }

        // Dump recording settings
        const audioTracks = this.stream.getAudioTracks();
        if (audioTracks.length > 0) {
            console.log('Record Setings:', audioTracks[0].getSettings());
        }
    }

    async startRecording() {
        this.audioContext = new AudioContext();
        const input = this.audioContext.createMediaStreamSource(this.stream!);
        this.recorder = new Recorder(input, { workerPath: getPublicPathFor(`recorderWorker.js`) });
        this.recorder.record();
    }

    async stopRecording() {
        this.recorder.stop();
        this.audioContext?.close();
        delete this.audioContext;
    }

    async closeStream() {
        this.stream?.getTracks().forEach(track => track.stop());
    }

    downloadRecorded(title: string) {
        this.recorder.exportWAV((buffer: Blob) => {
            downloadBlob(buffer, `${title}.wav`);
        });
    }
}
