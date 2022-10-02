import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useShallowEqualSelector } from '../utils';
import { actions as panicDialogActions } from '../redux/panic-dialog-feature';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import Button from '@material-ui/core/Button';
import { TransitionProps } from '@material-ui/core/transitions';
import { makeStyles, Typography } from '@material-ui/core';

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children?: React.ReactElement<any, any> },
    ref: React.Ref<unknown>
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const useStyles = makeStyles(theme => ({
    codeBlock: {
        marginTop: theme.spacing(3),
        fontFamily: 'monospace',
        color: 'white',
        backgroundColor: '#EF5350',
        whiteSpace: 'pre-wrap',
        padding: theme.spacing(2),
        borderRadius: theme.spacing(1),
        fontSize: 10,
    },
}));

export const PanicDialog = (props: {}) => {
    const dispatch = useDispatch();
    const classes = useStyles();

    let { visible, dismissed, errorProvided } = useShallowEqualSelector(state => state.panicDialog);

    const handleReloadApp = useCallback(() => {
        window.location.reload();
    }, []);

    const handleIgnore = useCallback(() => {
        dispatch(panicDialogActions.dismiss());
    }, [dispatch]);

    return (
        <Dialog
            open={visible && !dismissed}
            maxWidth={'sm'}
            fullWidth={true}
            scroll={'paper'}
            TransitionComponent={Transition as any}
            aria-labelledby="error-dialog-slide-title"
            aria-describedby="error-dialog-slide-description"
        >
            <DialogTitle id="alert-dialog-slide-title">Oops… Something unexpected happened.</DialogTitle>
            <DialogContent>
                <Typography color="textSecondary" variant="body1" component="div">
                    Try to restart the app. If the error persists, try the followings:
                    <ol>
                        <li>Use your browser in incognito mode.</li>
                        <li>Use a blank MiniDisc.</li>
                        <li>Try to use Web MiniDisc Pro on another computer.</li>
                    </ol>
                    If this does not solve the error, your unit might not be supported yet or you have encountered a bug.
                </Typography>
                <Typography variant="body1" component="div" className={classes.codeBlock}>
                    {errorProvided}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleIgnore} size="small">
                    Ignore and Continue
                </Button>
                <Button onClick={handleReloadApp} color="primary">
                    Restart the App
                </Button>
            </DialogActions>
        </Dialog>
    );
};
