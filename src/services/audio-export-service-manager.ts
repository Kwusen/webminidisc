import { CustomParameterInfo, CustomParameters } from '../custom-parameters';
import { AudioExportService, FFMpegAudioExportService } from './audio-export';
import { RemoteAtracExportService } from './remote-atrac-export';

interface AudioServicePrototype {
    create: new (parameters: CustomParameters) => AudioExportService;
    customParameters?: CustomParameterInfo[];
    name: string;
    description?: string;
}

export const AudioServices: AudioServicePrototype[] = [
    {
        name: 'Atracdenc',
        create: FFMpegAudioExportService as any,
        description: 'The standard open-source ATRAC encoder. Its ATRAC3 support is incomplete',
    },
    {
        name: 'Remote ATRAC Encoder',
        create: RemoteAtracExportService as any,
        customParameters: [
            {
                userFriendlyName: 'Server Address',
                varName: 'address',
                type: 'string',
                defaultValue: 'https://atrac.minidisc.wiki/',
                validator: content => {
                    try {
                        const asURL = new URL(content);
                        return asURL.pathname === '/';
                    } catch (e) {
                        return false;
                    }
                },
            },
        ],
        description:
            'A separate high-quality ATRAC encoder hosted on another server (as defined by https://github.com/thinkbrown/atrac-api)',
    },
];
