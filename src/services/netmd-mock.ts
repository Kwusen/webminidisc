import { Track, Channels, Encoding, Wireformat, TrackFlag, DeviceStatus, Group } from 'netmd-js';
import { Capability, NetMDService } from './netmd';
import { sleep, asyncMutex, recomputeGroupsAfterTrackMove, isSequential } from '../utils';
import { assert, sanitizeFullWidthTitle, sanitizeHalfWidthTitle } from 'netmd-js/dist/utils';
import { Mutex } from 'async-mutex';

class NetMDMockService implements NetMDService {
    public statusMonitorTimer: any;
    public mutex = new Mutex();
    public _tracksTitlesMaxLength = 1700;
    public _discTitle: string = 'Mock Disc';
    public _fullWidthDiscTitle: string = '';
    public _discCapacity: number = 80 * 60 * 512;
    public _tracks: Track[] = [
        {
            duration: 3 * 60 * 512,
            encoding: Encoding.sp,
            index: 0,
            channel: Channels.stereo,
            protected: TrackFlag.unprotected,
            title: 'Long name for - Mock Track 1 - by some artist -12398729837198723',
            fullWidthTitle: '',
        },
        {
            duration: 5 * 60 * 512,
            encoding: Encoding.sp,
            index: 1,
            channel: Channels.stereo,
            protected: TrackFlag.unprotected,
            title: 'Mock Track 2',
            fullWidthTitle: '',
        },
        {
            duration: 5 * 60 * 512,
            encoding: Encoding.sp,
            index: 2,
            channel: Channels.stereo,
            protected: TrackFlag.unprotected,
            title: 'Mock Track 3',
            fullWidthTitle: '',
        },
        {
            duration: 5 * 60 * 512,
            encoding: Encoding.sp,
            index: 3,
            channel: Channels.stereo,
            protected: TrackFlag.unprotected,
            title: 'Mock Track 4',
            fullWidthTitle: '',
        },
        {
            duration: 5 * 60 * 512,
            encoding: Encoding.sp,
            index: 4,
            channel: Channels.stereo,
            protected: TrackFlag.unprotected,
            title: 'Mock Track 5',
            fullWidthTitle: 'スコット と リバース',
        },
    ];
    public _groupsDef: {
        index: number;
        title: string | null;
        fullWidthTitle: string | null;
        tracksIdx: number[];
    }[] = [
        {
            title: null,
            fullWidthTitle: '',
            index: 0,
            tracksIdx: [2, 3, 4],
        },
        {
            title: 'Test',
            fullWidthTitle: '',
            index: 1,
            tracksIdx: [0, 1],
        },
    ];

    private capabilities: Capability[] = [];

    public _status: DeviceStatus = {
        discPresent: true,
        track: 0,
        time: { minute: 0, second: 0, frame: 4 },
        state: 'ready',
    };

    constructor({ overrideTitle, overrideFWTitle, capabilityContentList, capabilityPlaybackControl, capabilityMetadataEdit, capabilityTrackUpload, capabilityTrackDownload, capabilityDiscEject } : any){
        if(overrideTitle) this._discTitle = overrideTitle;
        if(overrideFWTitle) this._fullWidthDiscTitle = overrideFWTitle;
        if(capabilityDiscEject) this.capabilities.push(Capability.discEject);
        if(capabilityContentList) this.capabilities.push(Capability.contentList);
        if(capabilityPlaybackControl) this.capabilities.push(Capability.playbackControl);
        if(capabilityMetadataEdit) this.capabilities.push(Capability.metadataEdit);
        if(capabilityTrackUpload) this.capabilities.push(Capability.trackUpload);
        if(capabilityTrackDownload) this.capabilities.push(Capability.trackDownload);
    }

    public _getGroups(): Group[] {
        return this._groupsDef.map(g => ({
            title: g.title,
            index: g.index,
            tracks: this._tracks.filter(t => g.tracksIdx.includes(t.index)),
            fullWidthTitle: g.fullWidthTitle,
        }));
    }

    _updateTrackIndexes() {
        for (let i = 0; i < this._tracks.length; i++) {
            this._tracks[i].index = i;
        }
    }

    _getUsed() {
        let used = 0;
        for (let t of this._tracks) {
            used += t.duration;
        }
        return used;
    }

    _getTracksTitlesLength() {
        return this._tracks.reduce((acc, track) => acc + (track.title?.length ?? 0), 0);
    }

    _getDisc() {
        return {
            title: this._discTitle,
            fullWidthTitle: this._fullWidthDiscTitle,
            writeProtected: false,
            writable: true,
            left: this._discCapacity - this._getUsed(),
            used: this._getUsed(),
            total: this._discCapacity,
            trackCount: this._tracks.length,
            groups: this._getGroups(),
        };
    }

    async getServiceCapabilities() {
        return this.capabilities;
    }

    async pair() {
        return true;
    }

    async connect() {
        return true;
    }

    async listContent() {
        // This object ends up in the state of redux and Immer will freeze it.
        // That's why it's deep cloned
        return JSON.parse(JSON.stringify(this._getDisc()));
    }

    async renameGroup(gropuIndex: number, newName: string, newFullWidth?: string) {
        let group = this._groupsDef.find(n => n.index === gropuIndex);
        if (!group) {
            return;
        }
        group.title = newName;
        if (newFullWidth !== undefined) {
            group.fullWidthTitle = newFullWidth;
        }
    }

    async addGroup(groupBegin: number, groupLength: number, newName: string) {
        let ungroupedDefs = this._groupsDef.find(g => g.title === null);
        if (!ungroupedDefs) {
            return; // You can only group tracks that aren't already in a different group, if there's no such tracks, there's no point to continue
        }
        let ungroupedLengthBeforeGroup = ungroupedDefs.tracksIdx.length;

        const newGroupTracks = ungroupedDefs.tracksIdx.filter(idx => idx >= groupBegin && idx < groupBegin + groupLength);
        if (!isSequential(newGroupTracks)) {
            throw new Error('Invalid sequence of tracks!');
        }

        const newGroupDef = {
            title: newName,
            fullWidthTitle: '',
            index: groupBegin,
            tracksIdx: newGroupTracks,
        };
        this._groupsDef.push(newGroupDef);

        this._groupsDef = this._groupsDef.filter(g => g.tracksIdx.length !== 0).sort((a, b) => a.tracksIdx[0] - b.tracksIdx[0]);

        ungroupedDefs.tracksIdx = ungroupedDefs.tracksIdx.filter(idx => !newGroupTracks.includes(idx));
        if (ungroupedLengthBeforeGroup - ungroupedDefs.tracksIdx.length !== groupLength) {
            throw new Error('A track cannot be in 2 groups!');
        }
    }

    async deleteGroup(index: number) {
        const groups = this._getGroups();
        const group = groups.find(g => g.index === index);
        if (!group) {
            return;
        }
        let ungroupedGroup = this._groupsDef.find(n => n.title === null);
        if (!ungroupedGroup) {
            ungroupedGroup = {
                title: null,
                fullWidthTitle: null,
                tracksIdx: [],
                index: 0,
            };
            this._groupsDef.unshift(ungroupedGroup);
        }
        ungroupedGroup.tracksIdx = ungroupedGroup.tracksIdx.concat(group.tracks.map(t => t.index)).sort();
        this._groupsDef.splice(groups.indexOf(group), 1);
    }

    async rewriteGroups(groups: Group[]) {
        this._groupsDef = groups.map(g => ({
            title: g.title,
            fullWidthTitle: g.fullWidthTitle,
            index: g.index,
            tracksIdx: g.tracks.map(t => t.index),
        }));
    }

    async getDeviceStatus() {
        return JSON.parse(JSON.stringify(this._status));
    }

    async getDeviceName() {
        return `Generic MD Unit`;
    }

    async finalize() {}

    async renameTrack(index: number, newTitle: string, fullWidthTitle?: string) {
        newTitle = sanitizeHalfWidthTitle(newTitle);
        if (this._getTracksTitlesLength() + newTitle.length > this._tracksTitlesMaxLength) {
            throw new Error(`Track's title too long`);
        }
        if (fullWidthTitle !== undefined) {
            this._tracks[index].fullWidthTitle = sanitizeFullWidthTitle(fullWidthTitle);
        }
        this._tracks[index].title = newTitle;
    }

    async renameDisc(newName: string, fullWidthName?: string) {
        this._discTitle = sanitizeHalfWidthTitle(newName);
        if (fullWidthName !== undefined) this._fullWidthDiscTitle = sanitizeFullWidthTitle(fullWidthName);
    }

    async deleteTracks(indexes: number[]) {
        indexes = indexes.sort();
        indexes.reverse();
        for (let index of indexes) {
            this._groupsDef = recomputeGroupsAfterTrackMove(this._getDisc(), index, -1).groups.map(g => ({
                title: g.title,
                fullWidthTitle: g.fullWidthTitle,
                index: g.index,
                tracksIdx: g.tracks.map(t => t.index),
            }));
            this._tracks.splice(index, 1);
            this._groupsDef.forEach(
                g => (g.tracksIdx = g.tracksIdx.filter(tidx => this._tracks.find(t => t.index === tidx) !== undefined))
            );
        }
        this._updateTrackIndexes();
    }

    async moveTrack(src: number, dst: number, updateGroups?: boolean) {
        let t = this._tracks.splice(src, 1);
        assert(t.length === 1);
        this._tracks.splice(dst, 0, t[0]);
        this._updateTrackIndexes();
        if (updateGroups || updateGroups === undefined) {
            this._groupsDef = recomputeGroupsAfterTrackMove(this._getDisc(), src, dst).groups.map(g => ({
                title: g.title,
                fullWidthTitle: g.fullWidthTitle,
                index: g.index,
                tracksIdx: g.tracks.map(t => t.index),
            }));
        }
    }

    async wipeDisc() {
        this._tracks = [];
        await this.wipeDiscTitleInfo();
    }

    async ejectDisc() {
        console.log("Disc ejected!");
    }

    async wipeDiscTitleInfo() {
        this._groupsDef = [
            {
                index: 0,
                title: null,
                fullWidthTitle: null,
                tracksIdx: this._tracks.map(t => t.index),
            },
        ];
        this._discTitle = '';
        this._fullWidthDiscTitle = '';
    }

    async upload(
        title: string,
        fullWidthTitle: string,
        data: ArrayBuffer,
        format: Wireformat,
        progressCallback: (progress: { written: number; encrypted: number; total: number }) => void
    ) {
        progressCallback({ written: 0, encrypted: 0, total: 100 });

        let halfWidthTitle = sanitizeHalfWidthTitle(title);
        fullWidthTitle = sanitizeFullWidthTitle(fullWidthTitle);

        if (this._getTracksTitlesLength() + title.length > this._tracksTitlesMaxLength) {
            throw new Error(`Track's title too long`); // Simulates reject from device
        }

        const totalSteps = 3;
        for (let step = 0; step <= totalSteps; step++) {
            const written = (100 / totalSteps) * step;
            progressCallback({ written, encrypted: 100, total: 100 });
            await sleep(1000);
        }

        const newTrack = {
            title: halfWidthTitle,
            duration: 5 * 60 * 512,
            encoding: Encoding.sp,
            index: this._tracks.length,
            protected: TrackFlag.unprotected,
            channel: 0,
            fullWidthTitle: fullWidthTitle,
        };
        this._tracks.push(newTrack);
        this._groupsDef[0].tracksIdx.push(newTrack.index);

        await sleep(1000);
        progressCallback({ written: 100, encrypted: 100, total: 100 });
    }

    async download(index: number, progressCallback: (progress: { read: number; total: number }) => void) {
        return null;
    }

    @asyncMutex
    async play() {
        this._status.state = 'playing';
    }

    @asyncMutex
    async pause() {
        this._status.state = 'paused';
    }

    @asyncMutex
    async stop() {
        this._status.state = 'ready';
    }

    @asyncMutex
    async next() {
        if (this._status.track === null) {
            return;
        }
        this._status.track = Math.min(this._status.track + 1, this._tracks.length - 1) % this._tracks.length;
    }

    @asyncMutex
    async prev() {
        if (this._status.track === null) {
            return;
        }
        this._status.track = Math.max(this._status.track - 1, 0) % this._tracks.length;
    }

    async gotoTrack(index: number) {
        this._status.track = index;
        await sleep(500);
    }

    async gotoTime(index: number, hour = 0, minute = 0, second = 0, frame = 0) {
        this._status.track = index;
        await sleep(500);
    }

    async getPosition() {
        if (this._status.track === null || this._status.time === null) {
            return null;
        }
        return [this._status.track, 0, this._status.time.minute, this._status.time.second, this._status.time.frame];
    }

    @asyncMutex
    async prepareForUpload() {}
}

export { NetMDMockService };
