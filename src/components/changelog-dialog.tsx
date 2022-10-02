import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useShallowEqualSelector } from '../utils';

import { actions as appActions } from '../redux/app-feature';
import { actions as encoderDialogActions } from '../redux/encoder-setup-dialog-feature';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import { TransitionProps } from '@material-ui/core/transitions';
import { W95ChangelogDialog } from './win95/changelog-dialog';
import { Link } from '@material-ui/core';
import { batchActions } from 'redux-batched-actions';

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children?: React.ReactElement<any, any> },
    ref: React.Ref<unknown>
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const useStyles = makeStyles(theme => ({
    container: {
        display: 'flex',
        flexDirection: 'row',
    },
    formControl: {
        minWidth: 60,
    },
    toggleButton: {
        minWidth: 40,
    },
    dialogContent: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'stretch',
        height: 400,
    },
    header: {
        margin: 0,
    },
    list: {
        marginTop: 0,
    },
}));

export const ChangelogDialog = (props: {}) => {
    const dispatch = useDispatch();
    const classes = useStyles();

    const vintageMode = useShallowEqualSelector(state => state.appState.vintageMode);
    const visible = useShallowEqualSelector(state => state.appState.changelogDialogVisible);

    const handleClose = useCallback(() => {
        localStorage.setItem('version', (window as any).wmdVersion);
        dispatch(appActions.showChangelogDialog(false));
    }, [dispatch]);

    const handleOpenEncoderSettings = useCallback(() => {
        dispatch(batchActions([encoderDialogActions.setVisible(true), appActions.setMainView('WELCOME')]));
    }, [dispatch]);

    const content = (
        <React.Fragment>
            <h2 className={classes.header}>Version 1.3.0</h2>
            <ul className={classes.list}>
                <li>Renamed 'Factory Mode' to 'Homebrew Mode'</li>
                <li>Added track normalization</li>
                <li>
                    Added the ability to use a <Link onClick={handleOpenEncoderSettings}>high quality LP encoder</Link>
                </li>
                <li>Added song recognition</li>
                <li>Added CSV track list import and export</li>
                <li>Added support for ReplayGain</li>
                <li>Added remaining time display in the convert dialog</li>
                <li>Added the ability to export and import track lists from discs to CSV files</li>
                <li>Fixed line-in track recording</li>
                <li>
                    Updated to netmd-exploits 0.4.0
                    <ul>
                        <li>Added bulk ATRAC transfer via USB (Speedup from ~1.1x SP transfer to ~3x SP transfer)</li>
                        <li>Added support for IRQ-based ATRAC transfer for Type-R devices</li>
                        <li>Added support for direct TOC editing and cloning for Type-R devices</li>
                        <li>
                            Disabled tetris because of a suspected bug (If you tried running tetris, and can no longer upload tracks, please
                            contact me)
                        </li>
                        <li>Added the ability to force a 2x speed device to record SP in 4x</li>
                    </ul>
                </li>
                <li>
                    Updated to netmd-js 4.1.0
                    <ul>
                        <li>Sped up encryption</li>
                    </ul>
                </li>
            </ul>

            <h2 className={classes.header}>Version 1.2.2</h2>
            <ul className={classes.list}>
                <li>Added a button to enable ATRAC ripping in the main ui.</li>
                <li>ATRAC ripping bugfixes and better compatibility.</li>
            </ul>

            <h2 className={classes.header}>Version 1.2.1</h2>
            <ul className={classes.list}>
                <li>Labelled the factory mode better</li>
                <li>Fixed a bug in ATRAC autodetection</li>
            </ul>

            <h2 className={classes.header}>Version 1.2.0</h2>
            <ul className={classes.list}>
                <li>
                    Added factory mode support for Sony portables. It's available from the ellipsis menu
                    <ul>
                        <li>Added the ability to transfer music from NetMD to PC via USB</li>
                        <li>Added the ability to edit the ToC byte-by-byte</li>
                        <li>Added the ability to download and upload the ToC</li>
                        <li>Added the ability to dump the devices' RAM and ROM</li>
                        <li>Added the ability to load and play Tetris (thanks Sir68k!)</li>
                    </ul>
                </li>
                <li>Added ATRAC3 autodetection (for both WAVs and OMAs)</li>
                <li>Added better support for bookshelf systems</li>
                <li>Fixed incorrect title limits</li>
                <li>Fixed the title corruption bug</li>
            </ul>

            <h2 className={classes.header}>Version 1.1.1</h2>
            <ul className={classes.list}>
                <li>Prevented entering sleep mode when uploading tracks</li>
                <li>Fixed some small bugs</li>
            </ul>

            <h2 className={classes.header}>Version 1.1.0</h2>
            <ul className={classes.list}>
                <li>Added better support for Kenwood NetMD devices</li>
                <li>Added the ability to eject and change the disc</li>
                <li>Fixed some bugs regarding upload stalling</li>
            </ul>

            <h2 className={classes.header}>Version 0.3.0</h2>
            <ul className={classes.list}>
                <li>
                    Added support for <Link href="https://github.com/asivery/remote-netmd-server">Remote NetMD</Link>
                </li>
                <li>Fixed numerous bugs regarding NetMD upload and Sony LAMs</li>
                <li>Added support for downloading tracks via NetMD from the Sony MZ-RH1 recorder</li>
                <li>Numerous programming changes</li>
            </ul>

            <h2 className={classes.header}>Version 0.2.4</h2>
            <ul className={classes.list}>
                <li>Added the changelog dialog</li>
                <li>Added a basic self-test</li>
                <li>
                    Added full support for Sony LAM-Series devices (Issue{' '}
                    <Link href="https://github.com/cybercase/webminidisc/issues/29">#29</Link>,{' '}
                    <Link href="https://github.com/cybercase/webminidisc/issues/60">#60</Link>)
                </li>
                <li>
                    Overhauled the convert dialog
                    <ul>
                        <li>Added the ability to rename tracks before sending them to the recorder</li>
                        <li>Added a live preview of how the tracks are going to be titled when selecting different formats</li>
                        <li>
                            Added a warning about using too many characters (Issue{' '}
                            <Link href="https://github.com/cybercase/webminidisc/issues/66">#66</Link>)
                        </li>
                    </ul>
                </li>
            </ul>
        </React.Fragment>
    );

    if (vintageMode) {
        const p = {
            visible,
            handleClose,
            content,
        };
        return <W95ChangelogDialog {...p} />;
    }

    return (
        <Dialog
            open={visible}
            maxWidth={'xs'}
            fullWidth={true}
            TransitionComponent={Transition as any}
            aria-labelledby="changelog-dialog-slide-title"
            aria-describedby="changelog-dialog-slide-description"
        >
            <DialogTitle id="changelog-dialog-slide-title">Changelog</DialogTitle>
            <DialogContent className={classes.dialogContent}>{content}</DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};
