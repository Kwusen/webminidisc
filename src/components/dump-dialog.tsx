import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useShallowEqualSelector } from '../utils';

import { downloadTracks, recordTracks } from '../redux/actions';
import { actions as dumpDialogActions } from '../redux/dump-dialog-feature';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import serviceRegistry from '../services/registry';
import { TransitionProps } from '@material-ui/core/transitions';
import { W95DumpDialog } from './win95/dump-dialog';
import { exploitDownloadTracks } from '../redux/factory/factory-actions';
import { LineInDeviceSelect } from './line-in-helpers';

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children?: React.ReactElement<any, any> },
    ref: React.Ref<unknown>
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const useStyles = makeStyles(theme => ({
    head: {
        textShadow: '0px 0px 12px rgba(150, 150, 150, 1)',
        fontSize: theme.typography.h2.fontSize,
        textAlign: 'center',
        marginBottom: theme.spacing(2),
    },
}));

export const DumpDialog = ({
    trackIndexes,
    isCapableOfDownload,
    isExploitDownload,
}: {
    trackIndexes: number[];
    isCapableOfDownload: boolean;
    isExploitDownload: boolean;
}) => {
    const dispatch = useDispatch();
    const classes = useStyles();

    const [inputDeviceId, setInputDeviceId] = useState<string>('');

    let { visible } = useShallowEqualSelector(state => state.dumpDialog);
    let { deviceCapabilities } = useShallowEqualSelector(state => state.main);

    const handleClose = useCallback(() => {
        setInputDeviceId('');
        serviceRegistry.mediaRecorderService?.stopTestInput();
        dispatch(dumpDialogActions.setVisible(false));
    }, [dispatch]);

    const handleChange = useCallback(
        (ev: React.ChangeEvent<{ value: unknown }>) => {
            if (isCapableOfDownload) return;
            const deviceId = ev.target.value as string;
            setInputDeviceId(deviceId);
            serviceRegistry.mediaRecorderService?.stopTestInput();
            serviceRegistry.mediaRecorderService?.playTestInput(deviceId);
        },
        [setInputDeviceId, isCapableOfDownload]
    );

    const handleStartRecord = useCallback(() => {
        dispatch(recordTracks(trackIndexes, inputDeviceId));
        handleClose();
    }, [dispatch, handleClose, inputDeviceId, trackIndexes]);

    const handleStartTransfer = useCallback(
        (convertToWav: boolean = false) => {
            if (isExploitDownload) {
                dispatch(exploitDownloadTracks(trackIndexes, convertToWav));
            } else {
                dispatch(downloadTracks(trackIndexes, convertToWav));
            }
            handleClose();
        },
        [trackIndexes, dispatch, handleClose, isExploitDownload]
    );

    const vintageMode = useShallowEqualSelector(state => state.appState.vintageMode);

    if (vintageMode) {
        const p = {
            handleClose,
            handleChange,
            handleStartTransfer,
            visible,
            deviceCapabilities,
            inputDeviceId,
            isCapableOfDownload,
        };
        return <W95DumpDialog {...p} />;
    }

    return (
        <Dialog
            open={visible}
            maxWidth={'sm'}
            fullWidth={true}
            TransitionComponent={Transition as any}
            aria-labelledby="dump-dialog-slide-title"
            aria-describedby="dump-dialog-slide-description"
        >
            <DialogTitle id="dump-dialog-slide-title">{isCapableOfDownload ? 'Download' : 'Record'} Selected Tracks</DialogTitle>
            <DialogContent>
                <Typography component="p" variant="h2" className={classes.head}>
                    {`💽 ⮕ 💻`}
                </Typography>
                {isCapableOfDownload ? (
                    <React.Fragment>
                        {isExploitDownload ? (
                            <React.Fragment>
                                <Typography component="p" variant="body2">
                                    As you have enabled factory mode ripping in main ui, you can download tracks via USB.
                                </Typography>
                                <Typography component="p" variant="body2">
                                    Please keep in mind that this functionality is not stable.
                                </Typography>
                                <Typography component="p" variant="body2">
                                    <br />DOWNLOAD ORIGINAL will retrieve the tracks as ATRAC-encoded files, a compressed format used by NetMD devices but unsupported by most other audio players.
                                </Typography>
                                <Typography component="p" variant="body2">
                                    <br />DOWNLOAD DECOMPRESSED will first convert the tracks to standard WAV format, with a larger filesize but universally supported.
                                </Typography>
                            </React.Fragment>
                        ) : (
                            <Typography component="p" variant="body2">
                                As your device natively supports USB audio transfer, it is possible to transfer tracks via NetMD.
                            </Typography>
                        )}
                    </React.Fragment>
                ) : (
                    <LineInDeviceSelect inputDeviceId={inputDeviceId} handleChange={handleChange} />
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                {isCapableOfDownload ? (
                    <>
                        <Button variant="outlined" onClick={() => handleStartTransfer(false)}>Download original</Button>
                        <Button variant="outlined" onClick={() => handleStartTransfer(true)}>Download decompressed</Button>
                    </>
                ) : (
                    <Button onClick={handleStartRecord} disabled={inputDeviceId === ''}>
                        Start Record
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};
