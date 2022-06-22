import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useShallowEqualSelector } from '../utils';

import { actions as appActions } from '../redux/app-feature';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import { TransitionProps } from '@material-ui/core/transitions';
import { W95ChangelogDialog } from './win95/changelog-dialog';

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
        height: 300,
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

    const content = (
        <React.Fragment>
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
                    Added support for <a href="https://github.com/asivery/remote-netmd-server">Remote NetMD</a>
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
                    <a href="https://github.com/cybercase/webminidisc/issues/29">#29</a>,{' '}
                    <a href="https://github.com/cybercase/webminidisc/issues/60">#60</a>)
                </li>
                <li>
                    Overhauled the convert dialog
                    <ul>
                        <li>Added the ability to rename tracks before sending them to the recorder</li>
                        <li>Added a live preview of how the tracks are going to be titled when selecting different formats</li>
                        <li>
                            Added a warning about using too many characters (Issue{' '}
                            <a href="https://github.com/cybercase/webminidisc/issues/66">#66</a>)
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
