import axios from 'axios';
import React from 'react';
import { Icon, Tab, Label, Input, Button, Table, Checkbox, Modal, Dimmer, Loader, Progress, List, Segment } from 'semantic-ui-react';
import { Toast } from 'nr1';
import _ from 'lodash'


export default class APM extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      apdexToMove: [],
      loading: false,
      runlogResults: [],
      apdexProgress: null,
      labelsProgress:null,
      displayLog: false,
      apdexSearchText: '',
      apdexDirection: null,
      apdexColumn: null,
      apdexAllChecked: false,
      mySrcApps: [],
      mySrcAppsLoading: false,
      myDestApps: [],
      labelsToMove: [],
      labelsSearchText: '',
      labelsDirection: null,
      labelsColumn: null,
      labelsAllChecked: false,
      labelsSrcApps: [],
      labelsSrcAppsLoading: false,
      labelsDestApps: []

    }
    this.getApplicationData = this.getApplicationData.bind(this);
    this.mergeApdexLabelData = this.mergeApdexLabelData.bind(this);
  }

  handleMasterCheck = (e, data) => {
    const { apdexToMove, mySrcApps } = this.state;
    let collection = apdexToMove;

    if (data.checked) {
      this.setState({ apdexAllChecked: true })

      if (apdexToMove.length > 0) {
        collection = []
      }

      for (let p of mySrcApps) {
        if (p.apdexstatus !== "Moved") {
          collection.push(p.id)
        }
      }
    } else {
      this.setState({ apdexAllChecked: false, apdexToMove: [] })
    }
  }

  getDestId(srcid) {
    for (var i = 0; i < mySrcApps.length; i++) {
      var id = mySrcApps[i].id;
      if (id === srcid) {
        return mySrcApps[i].destid;
      }
    }
    return undefined;
  }


  getSrcAppNameByID(id) {

    const { mySrcApps } = this.state;
    for (var i = 0; i < mySrcApps.length; i++) {
      if (id === mySrcApps[i].id) {
        return mySrcApps[i].name;
      }
    }
    return undefined;
  }


  getDestAppNameByID(id) {

    const { myDestApps } = this.state;
    for (var i = 0; i < myDestApps.length; i++) {
      if (id === myDestApps[i].id) {
        return myDestApps[i].name;
      }
    }
    return undefined;
  }



  handleCheck = (e, data) => {
    const { apdexToMove } = this.state;
    let collection = apdexToMove;

    if (data.checked) {
      collection.push(data.value)
    } else {
      const index = collection.indexOf(data.value);
      if (index > -1) {
        collection.splice(index, 1);
      }
    }

    this.setState({
      apdexToMove: collection
    })
  }

  /******************************************************************************************************************************
   *
   *
   ***********************************************************************************************************************************************************************************************/
  mergeApdexLabelData(appdata, labeldata) {

    var _apps = [];

    if (appdata.data.applications.length > 0) {
      for (var i = 0; i < appdata.data.applications.length; i++) {
        if (appdata.data.applications[i].settings.app_apdex_threshold !== undefined) {
          var ele = {};
          ele.id = appdata.data.applications[i].id;
          ele.name = appdata.data.applications[i].name;
          ele.apdex = appdata.data.applications[i].settings.app_apdex_threshold;
          //  ele.apdexstatus = false;  //assume not moved

          ele.labels = [];
          // create a label array for the given app,

          if (labeldata !== undefined && labeldata.data.labels.length > 0) {
            for (var ls = 0; ls < labeldata.data.labels.length; ls++) {
              // for each link
              var labelobj = labeldata.data.labels[ls];
              for (var lsl = 0; lsl < labelobj.links.applications.length; lsl++) {
                var appid = labelobj.links.applications[lsl];
                if (appid === ele.id) {  // src app id match,
                  ele.labels.push(labelobj.key)
                }
              }
            }
          }
        }

        // sort the label  array before putting it in
        //ele.labels.sort();
        _apps.push(ele)

      }
    }

    return _apps;
  }




  getApplicationData() {

    const { sourceAdmin, destAdmin } = this.props;

    this.setState({
      mySrcAppsLoading: true,
      mySrcApps: []
    });

    const apps_api = "https://api.newrelic.com/v2/applications.json";
    const labels_api = "https://api.newrelic.com/v2/labels.json";

    const apps_rest_source = axios.get(apps_api, { headers: { "X-Api-Key": sourceAdmin } });
    const apps_rest_dest = axios.get(apps_api, { headers: { "X-Api-Key": destAdmin } });

    const labels_rest_source = axios.get(labels_api, { headers: { "X-Api-Key": sourceAdmin } });
    const labels_rest_dest = axios.get(labels_api, { headers: { "X-Api-Key": destAdmin } });

    axios.all([apps_rest_source, apps_rest_dest, labels_rest_source, labels_rest_dest])
      .then(axios.spread((...responses) => {

        const appdata_source = responses[0];  // apps source
        const appdata_dest = responses[1];  // apps dest
        const labeldata_source = responses[2];  // apps dest
        const labeldata_dest = responses[3];  // apps dest

        // transform (merge data)
        if (appdata_source.status == 200 && labeldata_source.status == 200) {
          var source_merged = this.mergeApdexLabelData(appdata_source, labeldata_source);
        } else {
          var source_merged = [];
        }

        if (appdata_dest.status == 200 && labeldata_dest.status == 200) {
          var dest_merged = this.mergeApdexLabelData(appdata_dest, labeldata_dest);
        } else {
          var dest_merged = [];
        }

        if (source_merged.length > 0 && dest_merged.length > 0) { //only perform checks if there are apps in both accounts
        // roll through the dest list, find the app name,  and set status if apdex = or not.
        for (var srcidx = 0; srcidx < source_merged.length; srcidx++) {
          // locate the dest obj by name,
          for (var destidx = 0; destidx < dest_merged.length; destidx++) {
            if (source_merged[srcidx].name === dest_merged[destidx].name) {
              source_merged[srcidx].destid = dest_merged[destidx].id; // record the destination id for this app now that we have it.

              source_merged[srcidx].destlabels = dest_merged[destidx].labels; // record the labels for later if making label update.

              if (source_merged[srcidx].apdex == dest_merged[destidx].apdex) {
                source_merged[srcidx].apdexstatus = "Moved";
              }

              if (source_merged[srcidx].labels.length > 0 && source_merged[srcidx].labels.length === dest_merged[destidx].labels.length) {
                source_merged[srcidx].labelstatus = "Moved"; // assume its moved,  and only set it to undefined if no match below. (reverse logic. )
                for (var lblidx = 0; lblidx < source_merged[srcidx].labels.length; lblidx++)  // for each label
                {
                  var srclabel = source_merged[srcidx].labels[lblidx];
                  var destlabel = dest_merged[destidx].labels[lblidx];
                  if (srclabel !== destlabel) {

                    source_merged[srcidx].labelstatus = undefined;

                    break;  // done...  assume not moved.
                  }

                }
              }
              break; // done with this app
            }
          }
        }
      }

      this.setState({ mySrcApps: source_merged, myDestApps: dest_merged } , () => {
        this.getApdexCalculation();
        this.getLabelsCalculation();
      })

      })).catch(error => {
        console.debug(error)
        Toast.showToast({
          title: 'Invalid Admin Key',
          description: 'Check source/destination keys.',
          type: Toast.TYPE.CRITICAL
        });
        this.setState({
          mySrcAppsLoading: false
        })
        //console.log(error.response.data.error.title)
      })

  }



  handleApdexSort = (clickedColumn) => () => {
    const { apdexColumn, mySrcApps, apdexDirection } = this.state

    if (apdexColumn !== clickedColumn) {
      this.setState({
        apdexColumn: clickedColumn,
        mySrcApps: _.sortBy(mySrcApps, [clickedColumn]),
        apdexDirection: 'ascending',
      })

      return
    }

    this.setState({
      mySrcApps: mySrcApps.reverse(),
      apdexDirection: apdexDirection === 'ascending' ? 'descending' : 'ascending',
    })
  }

  renderApplicationApdex() {
    let { apdexToMove, apdexColumn, apdexDirection, mySrcApps } = this.state;

    return (
      <>
        <div
          style={{
            overflowY: 'scroll',
            height: '500px',
            display: mySrcApps.length === 0 ? 'none' : ''
          }}
        >
          <Table sortable compact celled definition>
            <Table.Header>
              <Table.Row>
                <Table.Cell>
                  <Checkbox
                    indeterminate={apdexToMove.length > 0 && this.state.apdexAllChecked == false}
                    className="check"
                    onChange={this.handleMasterCheck}
                    checked={this.state.apdexAllChecked}
                  />
                </Table.Cell>
                <Table.HeaderCell sorted={apdexColumn === 'id' ? apdexDirection : null} onClick={this.handleApdexSort('id')}>ID</Table.HeaderCell>
                <Table.HeaderCell sorted={apdexColumn === 'name' ? apdexDirection : null} onClick={this.handleApdexSort('name')}>Application Name</Table.HeaderCell>
                <Table.HeaderCell>Apdex</Table.HeaderCell>
                <Table.HeaderCell sorted={apdexColumn === 'status' ? apdexDirection : null} onClick={this.handleApdexSort('status')}>Status</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {
                mySrcApps.filter(pol =>
                  pol.name ?
                    pol.name.toLowerCase().includes(this.state.apdexSearchText.toLowerCase())
                    : false
                ).map((pol, i) => {
                  return (
                    <Table.Row disabled={pol.apdexstatus} key={i}>
                      <Table.Cell collapsing singleLine>
                        {
                          <Checkbox
                            id={i}
                            disabled={pol.apdexstatus}
                            className="check"
                            value={pol.id}
                            onChange={this.handleCheck}
                            checked={apdexToMove.includes(pol.id) === true && pol.apdexstatus !== "Moved"}
                          />
                        }
                      </Table.Cell>
                      <Table.Cell>{pol.id}</Table.Cell>
                      <Table.Cell>{pol.name}</Table.Cell>
                      <Table.Cell>{pol.apdex}</Table.Cell>
                      {pol.apdexstatus ? <Table.Cell positive><Icon name='checkmark' />{pol.apdexstatus}</Table.Cell> : <Table.Cell negative><Icon name='attention' />Not Moved</Table.Cell>}
                    </Table.Row>
                  );
                })
              }
            </Table.Body>
          </Table>
        </div>
      </>
    )
  }


  async validateKeys() {
    const { sourceAdmin, destAdmin } = this.props;
    let response = []
    let url = 'https://api.newrelic.com/v2/applications.json'

    await axios({
      method: 'get',
      url: 'https://api.newrelic.com/v2/applications.json',
      headers: {
        'X-Api-Key': sourceAdmin
      }
    }).then(resp => {
    }).catch((error) => {
      console.debug(error);
      response.push("Source Key Error");
    })

    await axios({
      method: 'get',
      url: 'https://api.newrelic.com/v2/applications.json',
      headers: {
        'X-Api-Key': destAdmin
      }
    }).then(resp => {
    }).catch((error) => {
      console.debug(error);
      response.push("Destination Key Error");
    })

    return response;

  }

  async moveApdex() {
    const { sourceAdmin, destAdmin } = this.props;
    const { mySrcApps, apdexToMove, entitiesMoved } = this.state;
    let runResult = [];
    //let pushResults = [];
    //let currentIndex = 0;
    let apdexCopy = [...mySrcApps];
    let rest_calls = []
    this.setState({
      loading: true
    })


    let validKeys = await this.validateKeys(); //dummy api call to validate API keys, prior to re-rendering
    if (validKeys.length > 0) {
      for (let k of validKeys) {
        Toast.showToast({
          title: k,
          type: Toast.TYPE.CRITICAL
        })
      }
    } else {
      for (let pol of apdexToMove) {
        let aPol = await apdexCopy.filter(p => {
          return p.id === pol;
        })

        if (aPol[0].destid) { //destid has to exist to move apdex scores
        let targetid = aPol[0].destid;
        // setup the rest call

        var payload = {
          "application": {
            "settings": {
              "app_apdex_threshold": aPol[0].apdex
            }
          }
        }

        const options = {
          headers: { "X-Api-Key": destAdmin, 'Content-Type': 'application/json' }
        };

        var api_url = "https://api.newrelic.com/v2/applications/" + targetid + ".json"
        const apps_rest_source = axios.put(api_url, payload, options);
        // place the rest call into a array.
        rest_calls.push(apps_rest_source);
      } else {
        runResult.push({ "application": { name: aPol[0].name, status: "Failed-application does not exist in target account!" }})
      }
      } //for

      axios.all(rest_calls)
        .then(axios.spread((...responses) => {

          for (var i = 0; i < responses.length; i++) {
            var resp = responses[i];
            if (resp.status !== 200) {
              console.debug(resp);
            }
            // parse the respone... and info... put in log entry
            let logentry = { "application": { name: resp.data.application.name, status: (resp.status == 200) ? "Success" : "Failed" } }
            runResult.push(logentry);
          }

          this.getApplicationData();
          this.setState({
            runlogResults: runResult,
            apdexToMove: [],
            loading: false,
            apdexAllChecked: false
          })

        })).catch(error => {
          //this.setState({ sourceStatus: "ERROR: " + error.response.data.error.title })
          console.debug(error)

          let logentry = { "application": { name: resp.data.application.name, status: "Failed" } }
          runResult.push(logentry)

          Toast.showToast({
            title: "Error: " + error.response.data.error.title,
            type: Toast.TYPE.CRITICAL,
            description: "Please make sure application is moved to destination account."
          })

          this.setState({
            runlogResults: runResult,
            apdexToMove: [],
            loading: false,
            apdexAllChecked: false
          })
        })
      } // else
    }


  /*************************************************************************** LABELS *********************************************** */



  handleLabelsSort = (clickedColumn) => () => {
    const { labelsColumn, mySrcApps, labelsDirection } = this.state

    if (labelsColumn !== clickedColumn) {
      this.setState({
        labelsColumn: clickedColumn,
        mySrcApps: _.sortBy(mySrcApps, [clickedColumn]),
        labelsDirection: 'ascending',
      })

      return
    }

    this.setState({
      mySrcApps: mySrcApps.reverse(),
      labelsDirection: labelsDirection === 'ascending' ? 'descending' : 'ascending',
    })
  }

  handleLabelsMasterCheck = (e, data) => {
    const { labelsToMove, mySrcApps } = this.state;
    let collection = labelsToMove;

    if (data.checked) {
      this.setState({ labelsAllChecked: true })

      if (labelsToMove.length > 0) {
        collection = []
      }

      for (let p of mySrcApps) {
        if (p.labelstatus !== "Moved" && p.labels.length > 0) {
          collection.push(p.id)
        }
      }
    } else {
      this.setState({ labelsAllChecked: false, labelsToMove: [] })
    }
  }

  handleLabelsCheck = (e, data) => {
    const { labelsToMove } = this.state;
    let collection = labelsToMove;

    if (data.checked) {
      collection.push(data.value)
    } else {
      const index = collection.indexOf(data.value);
      if (index > -1) {
        collection.splice(index, 1);
      }
    }

    this.setState({
      labelsToMove: collection
    })
  }


  renderApplicationLabels() {
    let { labelsToMove, labelsColumn, labelsDirection, mySrcApps } = this.state;

    return (
      <>
        <div
          style={{
            overflowY: 'scroll',
            height: '500px',
            display: mySrcApps.length === 0 ? 'none' : ''
          }}
        >
          <Table sortable compact celled definition>
            <Table.Header>
              <Table.Row>
                <Table.Cell>
                  <Checkbox
                    indeterminate={labelsToMove.length > 0 && this.state.labelsAllChecked == false}
                    className="check"
                    onChange={this.handleLabelsMasterCheck}
                    checked={this.state.labelsAllChecked}
                  />
                </Table.Cell>
                <Table.HeaderCell sorted={labelsColumn === 'id' ? labelsDirection : null} onClick={this.handleLabelsSort('id')}>ID</Table.HeaderCell>
                <Table.HeaderCell sorted={labelsColumn === 'name' ? labelsDirection : null} onClick={this.handleLabelsSort('name')}>Application Name</Table.HeaderCell>
                <Table.HeaderCell>Labels</Table.HeaderCell>
                <Table.HeaderCell sorted={labelsColumn === 'status' ? labelsDirection : null} onClick={this.handleLabelsSort('status')}>Status</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {
                mySrcApps.filter(pol =>
                  pol.name ?
                    pol.name.toLowerCase().includes(this.state.labelsSearchText.toLowerCase())
                    : false
                ).map((pol, i) => {
                  return (
                    <Table.Row disabled={pol.labelstatus == "Moved" || pol.labels.length < 1} key={i}>
                      <Table.Cell collapsing singleLine>
                        {
                          <Checkbox
                            id={i}
                            disabled={pol.labelstatus}
                            className="check"
                            value={pol.id}
                            onChange={this.handleLabelsCheck}
                            checked={labelsToMove.includes(pol.id) === true && pol.labelstatus !== "Moved"}
                          />
                        }
                      </Table.Cell>
                      <Table.Cell>{pol.id}</Table.Cell>
                      <Table.Cell>{pol.name}</Table.Cell>
                      <Table.Cell>
                        {
                          pol.labels.map((pol2, j) => {
                            return (<div style={{ paddingTop: '5px', paddingLeft: '5px', display: 'inline-block' }}><Label color='blue' >{pol2}</Label></div>);
                          })
                        }
                      </Table.Cell>
                      {pol.labelstatus ? <Table.Cell positive><Icon name='checkmark' />{pol.labelstatus}</Table.Cell> : <Table.Cell negative><Icon name='attention' />Not Moved</Table.Cell>}
                    </Table.Row>
                  );
                })
              }
            </Table.Body>
          </Table>
        </div>
      </>
    )
  }



  async moveLabels() {
    const { sourceAdmin, destAdmin } = this.props;
    const { mySrcApps, labelsToMove, entitiesMoved } = this.state;
    let runResult = [];
    //let pushResults = [];
    //let currentIndex = 0;
    let appCopy = [...mySrcApps];
    let rest_calls = []
    this.setState({
      loading: true
    })


    let validKeys = await this.validateKeys(); //dummy api call to validate API keys, prior to re-rendering
    if (validKeys.length > 0) {
      for (let k of validKeys) {
        Toast.showToast({
          title: k,
          type: Toast.TYPE.CRITICAL
        })
      }
    } else {
      let labelmap = new Object();

      for (let pol of labelsToMove) {    // for each app that is selected to move.
        let aPol = await appCopy.filter(p => {
          return p.id === pol;
        })

        let srcObj = aPol[0];
        let targetid = srcObj.destid;
        if (targetid !== undefined) {
          // each of the src object has both a labels(it owns already), and a destlabels, which are whats at the dest
          // the presumption is that these don't match ,so we need to find the diffs, and apply to map.
          for (var idx = 0; idx < srcObj.labels.length; idx++) {
            var lbl = srcObj.labels[idx];
            // if the src label is NOT in the dest, we need to add the target id to this label.
            if (!srcObj.destlabels.includes(lbl)) {
              if (labelmap[lbl] == undefined) {
                labelmap[lbl] = [];
              }
              labelmap[lbl].push(targetid);
            }
          } //for
        } else {
          runResult.push({ "label": { name: "for application: " + srcObj.name, status: "Failed, application does not exist in target account!"}});
        }
      } //for


      // for each label assigned to the the app. build up a rest call for now.
      for (var key in labelmap) {
        var targetidlist = labelmap[key];
        var parts = key.split(":");
        var category = parts[0];
        var name = parts[1];
        // construct payload....
        var _payload = {
          "label": {
            "category": category,
            "name": name,
            "links": {
              "applications": [
                targetidlist  // here we are "adding" the target app id to the list , for this specific label.
              ],
              "servers": [
                "integer"
              ]
            }
          }
        }

        const options = {
          headers: { "X-Api-Key": destAdmin, 'Content-Type': 'application/json' }
        };
        var api_url = "https://api.newrelic.com/v2/labels.json"
        const apps_rest_source = axios.put(api_url, _payload, options);
        // place the rest call into a array.
        rest_calls.push(apps_rest_source);    // append rest calls.

      } //end per label for



      axios.all(rest_calls)
        .then(axios.spread((...responses) => {

          for (var i = 0; i < responses.length; i++) {
            var resp = responses[i];

            // data.label.links.applications, for each
            var appnames = "";
            for (var k = 0; k < resp.data.label.links.applications.length; k++) {
              var appname = this.getDestAppNameByID(resp.data.label.links.applications[k]);
              if (appname !== undefined)
                appnames += appname + ",";

            }


            // parse the respone... and info... put in log entry
            let logentry = { "label": { name: resp.data.label.key + " for application: " + appnames, status: (resp.status == 201) ? "Success" : "Failed" } }
            runResult.push(logentry);
          }

          this.getApplicationData();
          this.setState({
            runlogResults: runResult,
            labelsToMove: [],
            loading: false,
            labelsAllChecked: false
          })

        })).catch(error => {
          //this.setState({ sourceStatus: "ERROR: " + error.response.data.error.title })
          console.log(error.config.data)

          Toast.showToast({
            title: "Error:" + error.config.data,
            type: Toast.TYPE.CRITICAL
          })

          this.setState({
            runlogResults: runResult,
            labelsToMove: [],
            loading: false,
            labelsAllChecked: false
          })
        })

    }   // end of else...
  }




  displayRunLog = () => {
    this.setState({
      displayLog: true
    })
  }

  getContentColor = (cond) => {
    switch (cond.apdexstatus) {
      case "Success":
        return { color: 'green' };
      case "Partial Success":
        return { color: 'orange' };
      case "Failed":
        return { color: 'red' };
    }
  }

  renderLog() {
    const { runlogResults } = this.state;
    let polLogs = null;

    return (
      <>
        <Modal size='large' open={this.state.displayLog} onClose={() => this.setState({ displayLog: false })} closeIcon>
          <Modal.Header>Run Log</Modal.Header>
          <Modal.Content scrolling>
            <>
              {
                runlogResults.length > 0 ?
                  runlogResults.map(p => {
                    return (
                      <Segment>
                        <List>
                          <List.Item>

                            {p.application !== undefined ?
                              <List.Header style={p.application.status == "Success" ? { color: 'green' } : { color: 'red' }}>Apdex Score - Application: {p.application.name} - {p.application.status}</List.Header>
                              :
                              <List.Header style={p.label.status == "Success" ? { color: 'green' } : { color: 'red' }}>Labels {p.label.name} - {p.label.status}</List.Header>
                            }

                          </List.Item>
                        </List>
                      </Segment>
                    )
                  })
                  :
                  ''
              }
            </>
          </Modal.Content>
        </Modal>
      </>
    )
  }

  async getApdexCalculation() {
    const { mySrcApps } = this.state;
    let appCopy = [...mySrcApps];

    let apdexMoved = await appCopy.filter(a => {
      return a.apdexstatus;
    })
    let status = (apdexMoved.length / mySrcApps.length)*100;

    this.setState({
      apdexProgress: status
    })
  }

  async getLabelsCalculation() {
    const { mySrcApps } = this.state;
    let appCopy = [...mySrcApps];

    let labelsMoved = await appCopy.filter(a => {
      return a.labelstatus;
    })
    let status = (labelsMoved.length / mySrcApps.length)*100;

    this.setState({
      labelsProgress: status
    })
  }

  render() {
    let { sourceAdmin, destAdmin } = this.props;
    let { apdexToMove, loading, apdexProgress, labelsProgress, mySrcApps, labelsToMove } = this.state;

    const panes = [
      {
        menuItem: 'Apdex', render: () =>
          <Tab.Pane>
            {apdexProgress == null ? '' : <Progress className="progress" size='small' precision={1} percent={apdexProgress} indicating />}
            <Input icon='search' placeholder='Search Applications...' onChange={e => this.setState({ apdexSearchText: e.target.value })} />
            <br />
            <br />
            {mySrcApps.length === 0 ? <Loader active={this.state.mySrcAppsLoading} size='small'>Fetching Applications</Loader> : this.renderApplicationApdex()}
            {apdexToMove.length > 0 ?
              <>
                {
                  destAdmin == null || destAdmin == "" ?
                    <Button disabled style={{ marginTop: "20px" }} size='small' color='green'>Migrate Apdex</Button>
                    :
                    <Button style={{ marginTop: "20px" }} size='small' color='green' onClick={() => this.moveApdex()}>Migrate Apdex</Button>
                }
              </>
              :
              ''
            }
          </Tab.Pane>
      },
      {
        menuItem: 'Labels', render: () =>
          <Tab.Pane>
            {labelsProgress == null ? '' : <Progress className="progress" size='small' precision={1} percent={labelsProgress} indicating />}
            <Input icon='search' placeholder='Search Applications...' onChange={e => this.setState({ labelsSearchText: e.target.value })} />
            <br />
            <br />
            {mySrcApps.length === 0 ? <Loader active={this.state.mySrcAppsLoading} size='small'>Fetching Applications</Loader> : this.renderApplicationLabels()}
            {labelsToMove.length > 0 ?
              <>
                {
                  destAdmin == null || destAdmin == "" ?
                    <Button disabled style={{ marginTop: "20px" }} size='small' color='green'>Migrate Label(s)</Button>
                    :
                    <Button style={{ marginTop: "20px" }} size='small' color='green' onClick={() => this.moveLabels()}>Migrate Label(s)</Button>
                }
              </>
              :
              ''
            }
          </Tab.Pane>
      }
    ]

    return (
      <>
        <Dimmer active={loading}>
          <Loader size='medium'>Working</Loader>
        </Dimmer>

        {sourceAdmin == null || sourceAdmin == "" || destAdmin == null || destAdmin == "" ?
          <Button disabled size='small' color='black'>Fetch Applications</Button>
          :
          <Button size='small' color='black' onClick={() => this.getApplicationData()}>Fetch Applications</Button>
        }
        <Button style={{ float: "right" }} color='black' onClick={this.displayRunLog}>View Run Log</Button>
        {this.state.displayLog ? this.renderLog() : ''}
        <Tab panes={panes} onTabChange={this.handleTabChange} />
      </>
    )
  }
}
