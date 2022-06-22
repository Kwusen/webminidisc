import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { enableBatching } from 'redux-batched-actions';
import { savePreference, loadPreference } from '../utils';

export type TitleFormatType = 'filename' | 'title' | 'album-title' | 'artist-title' | 'artist-album-title' | 'title-artist';
export type UploadFormat = 'SP' | 'LP2' | 'LP4';

export interface ConvertDialogFeature {
    visible: boolean;
    format: UploadFormat;
    titleFormat: TitleFormatType;
    titles: { title: string; fullWidthTitle: string; duration: number; forcedEncoding: 'LP2' | 'LP4' | null; bytesToSkip: number }[];
}

const initialState: ConvertDialogFeature = {
    visible: false,
    format: loadPreference('uploadFormat', 'LP2') as UploadFormat,
    titleFormat: loadPreference('trackTitleFormat', 'filename') as TitleFormatType,
    titles: [],
};

const slice = createSlice({
    name: 'convertDialog',
    initialState,
    reducers: {
        setVisible: (state, action: PayloadAction<boolean>) => {
            state.visible = action.payload;
        },
        setFormat: (state, action: PayloadAction<UploadFormat>) => {
            state.format = action.payload;
            savePreference('uploadFormat', state.format);
        },
        setTitleFormat: (state, action: PayloadAction<TitleFormatType>) => {
            state.titleFormat = action.payload;
            savePreference('trackTitleFormat', state.titleFormat);
        },
        setTitles: (
            state,
            action: PayloadAction<
                { title: string; fullWidthTitle: string; duration: number; forcedEncoding: 'LP2' | 'LP4' | null; bytesToSkip: number }[]
            >
        ) => {
            state.titles = action.payload;
        },
    },
});

export const { actions, reducer } = slice;
export default enableBatching(reducer);
