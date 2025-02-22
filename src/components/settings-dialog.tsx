import React, { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { forAnyDesktop, forWideDesktop, useShallowEqualSelector } from '../utils';

import { actions as appActions } from '../redux/app-feature';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Switch from '@material-ui/core/Switch';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import { TransitionProps } from '@material-ui/core/transitions';
import { makeStyles } from '@material-ui/core';
import { AudioServices } from '../services/audio-export-service-manager';
import { renderCustomParameter } from './custom-parameters-renderer';
import { initializeParameters, isAllValid } from '../custom-parameters';
import { batchActions } from 'redux-batched-actions';

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children?: React.ReactElement<any, any> },
    ref: React.Ref<unknown>
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

function deepCompare<T>(a: T, b: T) {
    if (typeof a !== 'object') {
        return a === b;
    }
    if (Array.isArray(a)) {
        for (let e in a) {
            if (a[e] !== (b as any)[e]) return false;
        }
        return true;
    }
    for (let [k, v] of Object.entries(a)) {
        if (!deepCompare(v, (b as any)[k])) return false;
    }
    return true;
}

const useStyles = makeStyles(theme => ({
    main: {
        [forAnyDesktop(theme)]: {
            height: 600,
        },
        [forWideDesktop(theme)]: {
            height: 700,
        },
    },
    propertyBox: {
        display: 'flex',
        alignItems: 'center',
        marginRight: 0,
    },
    spread: {
        display: 'block',
        flexGrow: 1,
    },
    wider: {
        minWidth: 150,
    },
    header: {
        color: theme.palette.primary.main,
        '&:not(:first-child)': {
            marginTop: theme.spacing(3),
        },
    },
    fieldMargin: {
        marginLeft: theme.spacing(2),
    },
    encoderDescription: {
        marginLeft: theme.spacing(2),
        marginBottom: theme.spacing(2),
        marginTop: theme.spacing(2),
    },
}));

const SimpleField = ({
    children,
    name,
    classes,
    formControl = false,
    tooltip,
}: {
    name: string;
    formControl?: boolean;
    children: ReactElement<any, any>;
    classes: ReturnType<typeof useStyles>;
    tooltip?: string;
}) => {
    const element = formControl ? (
        <FormControlLabel
            labelPlacement="start"
            label={name + ':'}
            name={name + ':'}
            control={children}
            classes={{ root: classes.propertyBox, label: classes.spread }}
        />
    ) : (
        <Box className={classes.propertyBox}>
            <Typography className={classes.fieldMargin}>{name}:</Typography>
            <span className={classes.spread} />
            {children}
        </Box>
    );

    if (tooltip) {
        return <Tooltip title={tooltip}>{element}</Tooltip>;
    } else {
        return element;
    }
};

export const SettingsDialog = (props: {}) => {
    const dispatch = useDispatch();
    const classes = useStyles();

    const visible = useShallowEqualSelector(state => state.appState.settingsDialogVisible);

    // Appearance properties
    const { colorTheme, pageFullHeight, pageFullWidth } = useShallowEqualSelector(state => state.appState);

    // Functionality properties
    const { fullWidthSupport } = useShallowEqualSelector(state => state.appState);
    const { archiveDiscCreateZip, factoryModeUseSlowerExploit, factoryModeShortcuts, factoryModeNERAWDownload, discProtectedDialogDisabled } = useShallowEqualSelector(
        state => state.appState
    );

    // Encoder properties
    const {
        audioExportService: globalStateAudioExportService,
        audioExportServiceConfig: globalStateAudioExportServiceConfig,
    } = useShallowEqualSelector(state => state.appState);
    const [currentExportService, setCurrentExportService] = useState(globalStateAudioExportService);
    const [currentExportServiceConfig, setExportServiceConfig] = useState(globalStateAudioExportServiceConfig);
    const currentService = AudioServices[currentExportService ?? 0];

    // Functions required for the app to calculate weather or not it needs to restart to apply the changes,
    // create the initial state, etc...
    // Later more reboot-sensitive fileds can be added
    const getStateRebootRequired = useMemo(
        () => () => ({
            currentExportServiceConfig,
            currentExportService,
        }),
        [currentExportServiceConfig, currentExportService]
    );
    const saveBeforeReset = useCallback(() => {
        dispatch(
            batchActions([
                appActions.setAudioExportService(currentExportService),
                appActions.setAudioExportServiceConfig(currentExportServiceConfig),
            ])
        );
    }, [dispatch, currentExportService, currentExportServiceConfig]);

    const [initialState, setInitialState] = useState<ReturnType<typeof getStateRebootRequired> | null>(null);

    // "Constructor" code
    useEffect(() => {
        if (visible && initialState === null) {
            // Save the initial state when the dialog opens
            setInitialState(getStateRebootRequired());
        }
    }, [visible, initialState, getStateRebootRequired]);

    const isRestartRequired = useCallback(() => {
        if (initialState === null) return false;
        return !deepCompare(getStateRebootRequired(), initialState);
    }, [initialState, getStateRebootRequired]);

    const verifyIfInputsValid = useCallback(() => {
        // Later more inputs can be added
        const canExit = isAllValid(currentService.customParameters, currentExportServiceConfig);
        return canExit;
    }, [currentExportServiceConfig, currentService.customParameters]);

    //Appearance configuration
    const handleThemeChange = useCallback(
        event => {
            dispatch(appActions.setDarkMode(event.target.value));
        },
        [dispatch]
    );
    const handlePageFullHeightChange = useCallback(() => {
        dispatch(appActions.setPageFullHeight(!pageFullHeight));
    }, [dispatch, pageFullHeight]);
    const handlePageFullWidthChange = useCallback(() => {
        dispatch(appActions.setPageFullWidth(!pageFullWidth));
    }, [dispatch, pageFullWidth]);

    // Functionality configuration
    const handleToggleFullWidth = useCallback(() => {
        dispatch(appActions.setFullWidthSupport(!fullWidthSupport));
    }, [dispatch, fullWidthSupport]);
    const handleToggleDiscProtectedDialogDisabled = useCallback(() => {
        dispatch(appActions.disableDiscProtectedDialog(!discProtectedDialogDisabled));
    }, [dispatch, discProtectedDialogDisabled]);
    const handleToggleArchiveDiscCreateZip = useCallback(() => {
        dispatch(appActions.setArchiveDiscCreateZip(!archiveDiscCreateZip));
    }, [dispatch, archiveDiscCreateZip]);
    const handleToggleFactoryModeUseSlowerExploits = useCallback(() => {
        dispatch(appActions.setFactoryModeUseSlowerExploit(!factoryModeUseSlowerExploit));
    }, [dispatch, factoryModeUseSlowerExploit]);
    const handleToggleFactoryModeShortcuts = useCallback(() => {
        dispatch(appActions.setFactoryModeShortcuts(!factoryModeShortcuts));
    }, [dispatch, factoryModeShortcuts]);
    const handleToggleFactoryModeNERAWDownload = useCallback(() => {
        dispatch(appActions.setFactoryModeNERAWDownload(!factoryModeNERAWDownload));
    }, [dispatch, factoryModeNERAWDownload]);

    //Encoder configuration
    const handleExportServiceChanges = useCallback(event => {
        let serviceId = event.target.value;
        setCurrentExportService(serviceId);
        setExportServiceConfig(initializeParameters(AudioServices[serviceId].customParameters));
    }, []);

    const handleExportServiceParameterChange = useCallback((varName, value) => {
        setExportServiceConfig(oldData => {
            let newData = { ...oldData };
            newData[varName] = value;
            return newData;
        });
    }, []);

    const handleClose = useCallback(() => {
        setInitialState(null);
        if (isRestartRequired()) {
            saveBeforeReset();
            // Trigger a reset.
            dispatch(appActions.setMainView('WELCOME'));
        } else {
            dispatch(appActions.showSettingsDialog(false));
        }
    }, [isRestartRequired, dispatch, saveBeforeReset]);

    return (
        <Dialog
            open={visible}
            maxWidth={'sm'}
            classes={{ paper: classes.main }}
            fullWidth={true}
            TransitionComponent={Transition as any}
            aria-labelledby="about-dialog-slide-title"
        >
            <DialogTitle id="about-dialog-slide-title">Settings</DialogTitle>
            <DialogContent>
                <DialogContentText className={classes.header}>Appearance</DialogContentText>
                <SimpleField name="Color theme" classes={classes}>
                    <Select className={classes.wider} value={colorTheme} onChange={handleThemeChange}>
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                        <MenuItem value="dark-blue">Dark (Blue)</MenuItem>
                        <MenuItem value="system">Device Theme</MenuItem>
                    </Select>
                </SimpleField>
                <SimpleField name="Stretch Web Minidisc Pro to fill the screen vertically" classes={classes} formControl={true}>
                    <Switch checked={pageFullHeight} onChange={handlePageFullHeightChange} />
                </SimpleField>
                <SimpleField name="Stretch Web Minidisc Pro to fill the screen horizontally" classes={classes} formControl={true}>
                    <Switch checked={pageFullWidth} onChange={handlePageFullWidthChange} />
                </SimpleField>

                <DialogContentText className={classes.header}>Functionality</DialogContentText>
                <SimpleField
                    name="Enable full width title editing"
                    classes={classes}
                    formControl={true}
                    tooltip="This advanced feature enables the use of Hiragana and Kanji alphabets. More about this in Support and FAQ."
                >
                    <Switch checked={fullWidthSupport} onChange={handleToggleFullWidth} />
                </SimpleField>
                <SimpleField name="Enable disc-protected warning dialog" classes={classes} formControl={true}>
                    <Switch checked={!discProtectedDialogDisabled} onChange={handleToggleDiscProtectedDialogDisabled} />
                </SimpleField>
                <SimpleField
                    name="Create a ZIP file when using 'Archive Disc'"
                    classes={classes}
                    formControl={true}
                    tooltip="Enabling it might increase memory usage when using the Homebrew mode's 'Archive Disc' feature"
                >
                    <Switch checked={archiveDiscCreateZip} onChange={handleToggleArchiveDiscCreateZip} />
                </SimpleField>
                <SimpleField
                    name="Use the slower exploit for ATRAC ripping"
                    classes={classes}
                    formControl={true}
                    tooltip="This fixes a bug where the device would lock up on a small percentage of Apple ARM-based Macs"
                >
                    <Switch checked={factoryModeUseSlowerExploit} onChange={handleToggleFactoryModeUseSlowerExploits} />
                </SimpleField>
                <SimpleField
                    name="Enable homebrew mode shortcuts"
                    classes={classes}
                    formControl={true}
                    tooltip="This enables an additional section in the menu allowing you to easily access homebrew mode features from the main menu"
                >
                    <Switch checked={factoryModeShortcuts} onChange={handleToggleFactoryModeShortcuts} />
                </SimpleField>
                <SimpleField
                    name="Download raw streams from netmd-exploits (expert feature)"
                    classes={classes}
                    formControl={true}
                    tooltip="This will cause netmd-exploits to download .NERAW files instead of .AEA or .WAV. These files can be used to reconstruct the sector layout in the player's DRAM and rebuild the track in case of a corruption"
                >
                    <Switch checked={factoryModeNERAWDownload} onChange={handleToggleFactoryModeNERAWDownload} />
                </SimpleField>

                <DialogContentText className={classes.header}>Encoding</DialogContentText>
                <SimpleField name="Encoder to use" classes={classes}>
                    <Select className={classes.wider} value={currentExportService} onChange={handleExportServiceChanges}>
                        {AudioServices.map((n, i) => (
                            <MenuItem value={i} key={`${i}`}>
                                {n.name}
                            </MenuItem>
                        ))}
                    </Select>
                </SimpleField>
                <Typography className={classes.encoderDescription}>{currentService.description}</Typography>
                <Box className={classes.fieldMargin}>
                    {currentService.customParameters?.map(n =>
                        renderCustomParameter(n, currentExportServiceConfig![n.varName], handleExportServiceParameterChange)
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button disabled={!verifyIfInputsValid()} onClick={handleClose}>
                    {isRestartRequired() ? 'Save and Reload' : 'Close'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
