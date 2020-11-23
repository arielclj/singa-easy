import React from "react"
import PropTypes from "prop-types"

import axios from 'axios';

// import { connect } from "react-redux"
import { compose } from "redux"
// import { push } from "connected-react-router"

import { withStyles } from "@material-ui/core/styles"
import Typography from "@material-ui/core/Typography"
import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';
import LinearProgress from '@material-ui/core/LinearProgress';

import Grid from '@material-ui/core/Grid';

import FileDropzone from "../components/FileDropzone"
import UploadProgressBar from '../components/UploadProgressBar';

// // read query-string
// import queryString from 'query-string'

const styles = theme => ({
    block: {
        display: "block",
    },
    addDS: {
        marginRight: theme.spacing(1),
    },
    contentWrapper: {
        margin: "16px 16px",
        //position: "relative",
        minHeight: 200,
    },
    // for query-params
    pos: {
        marginBottom: 12,
        alignItems: 'center'
    },
    // for response display
    response: {
        flexGrow: 1,
        marginTop: "20px",
    },
    explainImg: {
        margin: "0 auto",
        width: "100%",
    },
    progbarStatus: {
        padding: 20,
        overflowWrap: "break-word"
    },
    marginTop:{
        marginTop: "2rem"
    }
})

class SpeechRecognition extends React.Component {
    static propTypes = {
        classes: PropTypes.object.isRequired,
        handleHeaderTitleChange: PropTypes.func,
        resetLoadingBar: PropTypes.func,
        formState: PropTypes.string,
    }

    state = {
        predictorHost: "",
        FormIsValid: false,
        noPredictorSelected: false,
        // populate the files state from FileDropzone
        selectedFiles: [],
        uploadedFile: null,
        // post-upload status:
        message: "",
        uploadPercentage: 0,
        formState: "init",
        // populate the response
        predictionDone: false,
    }

    componentDidUpdate(prevProps, prevState) {
        // if form's states have changed
        if (
            this.state.selectedFiles !== prevState.selectedFiles
        ) {
            if (
                this.state.selectedFiles.length !== 0
            ) {
                this.setState({
                    FormIsValid: true
                })
                // otherwise disable COMMIT button
            } else {
                this.setState({
                    FormIsValid: false
                })
            }
        }
    }

    handleClick = (e) => {
        e.preventDefault();
        navigator.permissions.query({
            name: 'clipboard-read',
            allowWithoutGesture: true
        }).then(result => {
            console.log(result);
            if (result.state === 'prompt' || result.state === 'granted' ) {
                navigator.clipboard.readText().then(
                    clipText => { this.setState({ predictorHost:clipText });
                    document.getElementById("url").value = clipText;
                     });
            }
            else {alert("Permission to access clipboard denied!")}
        })

    }
    onDrop = files => {
        console.log("onDrop called, acceptedFiles: ", files)
        const currentFile = files[0]
        const fileReader = new FileReader()
        fileReader.addEventListener("load", () => {
            this.setState({
                uploadedFile: fileReader.result
            })
        })
        fileReader.readAsText(currentFile)
        this.setState({
            selectedFiles: files
        })
    }
    handleRemoveCSV = () => {
        this.setState({
            selectedFiles: []
        })
        console.log("file removed")
    }
    handleChange = (e) => {
        this.setState({ predictorHost: e.target.value });
        console.log(this.state);
    }
    handleCommit = async e => {
        e.preventDefault();
        this.setState({
            // reset previous response, if any
            predictionDone: false,
            uploadPercentage: 0,
            FormIsValid: false,
            formState: "loading",
        })

        const formData = new FormData()
        console.log("selectedFiles[0]: ", this.state.selectedFiles[0])
        formData.append("img", this.state.selectedFiles[0])

        try {
            const res = await axios.post(
                `http://${this.state.predictorHost}`,
                // `http://panda.d2.comp.nus.edu.sg:54691/predict`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: progressEvent => {
                        // progressEvent will contain loaded and total
                        let percentCompleted = parseInt(
                            Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        )
                        console.log("From EventEmiiter, file Uploaded: ", percentCompleted)
                        this.setState({
                            uploadPercentage: percentCompleted
                        })
                    }
                }
            );
            // res.data is the object sent back from the server
            console.log("file uploaded, axios res.data: ", res.data)
            console.log("axios full response schema: ", res)

            this.setState(prevState => ({
                formState: "idle",
                message: "Upload and prediction done",
                predictionDone: true,
            }))
        } catch (err) {
            console.error(err, "error")
            this.setState({
                message: "Upload failed"
            })
        }
    }

    render() {

        const { classes } = this.props

        return (
            <React.Fragment>

                <div className={classes.contentWrapper}>
                    <Typography className={classes.pos} gutterBottom align="center">
                        Predictor Host: {this.state.predictorHost}
                    </Typography>
                    <form onSubmit={this.handleSubmit} align="center">
                        <div className="predhost">
                            <input id="url"
                                type="text"
                                onChange={this.handleChange}
                                value={this.state.predictorHost}
                                className="form-control" />
                        </div><br />
                        <Button variant="contained"
                            color="primary"
                            onClick={this.handleClick}>Paste link here</Button>
                    </form>
                    <br />
                    
                    <Divider />
                    <br />
                    <Typography variant="h5" gutterBottom align="center">
                        Upload Test Audio
                  </Typography>
                    <FileDropzone
                        files={this.state.selectedFiles}
                        onCsvDrop={this.onDrop}
                        onRemoveCSV={this.handleRemoveCSV}
                        AcceptedMIMEtypes={`
                      audio/*
                    `}
                        MIMEhelperText={`
                    (Only audio format will be accepted)
                    `}
                        UploadType={`Audio`}
                    />
                    <br />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={this.handleCommit}
                        disabled={
                            !this.state.FormIsValid ||
                            this.state.formState === "loading"}
                    >
                        Predict
                  </Button>
                </div>
                <div className={classes.contentWrapper}>
                    <div className={classes.progbarStatus}>

                        {this.state.formState === "loading" &&
                            <React.Fragment>
                                <LinearProgress color="secondary" />
                                <br />
                            </React.Fragment>
                        }
                        <UploadProgressBar
                            percentCompleted={this.state.uploadPercentage}
                            fileName={
                                this.state.selectedFiles.length !== 0
                                    ? this.state.selectedFiles[0]["name"]
                                    : ""
                            }
                            formState={this.state.formState}
                            dataset={this.state.newDataset}
                        />
                        <br />
                        <Typography component="p">
                            <b>{this.state.message}</b>
                            <br />
                        </Typography>
                    </div>
                    <br />
                    {this.state.predictionDone &&
                        <div className={classes.response}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="h5" gutterBottom align="center">
                                        Response returned
                                    </Typography>
                                </Grid>
                            </Grid>
                            <br />
                            <Divider />
                        </div>
                    }
                </div>
            </React.Fragment>
        )
    }
}

export default compose(withStyles(styles))(SpeechRecognition);