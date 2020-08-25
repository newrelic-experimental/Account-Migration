import axios from 'axios';
import React from 'react';
import { Toast } from 'nr1';
import { Button, Checkbox, Dimmer, Icon, Input, List, Loader, Modal, Progress, Segment, Table } from 'semantic-ui-react';
import _ from 'lodash';

export default class Dashboard extends React.Component {

  constructor(props) {
      super(props);
      this.state = {
        sourceDashboards: [],
        loading: false,
        searchText: '',
        dashboardsToMove: [],
        dashProgress: null,
        dashCol: null,
        dashDirection: null,
        dashStatus: [],
        displayLog: false,
        allDashChecked: false,
        migrating: false
      }
  }

  displayRunLog = () => {
    this.setState({
      displayLog: true
    })
  }

  async getSrcDashboards(api, sourceHead) {
    let src = null;

    await axios({
      method: 'get',
      url: api,
      headers: sourceHead
    }).then((resp) => {
      if (resp.status == 200) {
        src = resp.data.dashboards;
      }
    }).catch((error) => {
      console.debug("Source Account Dashboard Retrieval Error");
      console.debug(error);
      Toast.showToast({
        title: 'Source Account Dashboard Retrieval Error. Please check source admin key.',
        description: "Check console debug logs.",
        type: Toast.TYPE.CRITICAL
      })
    })

    return src;
  }

  async getDestDashboards(api, destHead) {
    let dst = null;

    await axios({
      method: 'get',
      url: api,
      headers: destHead
    }).then((resp) => {
      if (resp.status == 200) {
        dst = resp.data.dashboards;
      }
    }).catch((error) => {
      console.debug("Destination Account Dashboard Retrieval Error");
      console.debug(error);
      Toast.showToast({
        title: 'Destination Account Dashboard Retrieval Error. Please check destination admin key.',
        description: "Check console debug logs.",
        type: Toast.TYPE.CRITICAL
      })
    })

    return dst;
  }

  async getDashboardCalculation() {
    const { sourceDashboards } = this.state;
    let dashCopy = [...sourceDashboards];

    let dashMoved = await dashCopy.filter(d => {
      return d.status;
    })
    let status = (dashMoved.length / sourceDashboards.length)*100;

    this.setState({
      dashProgress: status
    })
  }


  async getAllDashboards() {
    const { sourceAdmin, destAdmin } = this.props;
    const api = 'https://api.newrelic.com/v2/dashboards.json';
    const srcHeaders = { 'X-Api-Key': sourceAdmin , 'Content-Type': 'application/json' };
    const destHeaders = { 'X-Api-Key': destAdmin , 'Content-Type': 'application/json' };

    this.setState({
      loading: true,
      sourceDashboards: [],
      destDashboards: []
    })

    let promises = [this.getSrcDashboards(api, srcHeaders), this.getDestDashboards(api, destHeaders)];

    Promise.all(promises).then(resp => {
      let source = resp[0];
      let dest = resp[1];

      if (source == null || dest == null) {
        console.debug("Unable to retrieve dashboards");
        this.setState({loading: false})
      } else {
        for (var s=0; s < source.length; s++) {
          for (var d=0; d < dest.length; d++) {
            if (source[s].title == dest[d].title) {
              source[s].status = "Moved";
              break;
            }
          }
        }
        this.setState({
          sourceDashboards: source,
          loading: false,
        }, () => {
          this.getDashboardCalculation();
        })
      }
    })
  }

  handleDashMasterCheck = (e, data) => {
    const { dashboardsToMove, sourceDashboards } = this.state;
    let collection = dashboardsToMove;

    if (data.checked) {
      this.setState({ allDashChecked: true })

      if (dashboardsToMove.length > 0) {
        collection = [];
      }

      for (let d of sourceDashboards) {
        if (d.status !== "Moved") {
          collection.push(d.id);
        }
      }
    } else {
      this.setState({ allDashChecked: false, dashboardsToMove: [] })
    }
  }

  handleDashSort = (clickedColumn) => () => {
    const { dashCol, sourceDashboards, dashDirection } = this.state;

    if (dashCol !== clickedColumn) {
      this.setState({
        dashCol: clickedColumn,
        sourceDashboards: _.sortBy(sourceDashboards, [clickedColumn]),
        chanDirection: 'ascending'
      })

      return;
    }

    this.setState({
      sourceDashboards: sourceDashboards.reverse(),
      dashDirection: dashDirection === 'ascending' ? 'descending' : 'ascending'
    })
  }

  handleDashCheck = (e, data) => {
    const { dashboardsToMove } = this.state;
    let dCollection = dashboardsToMove;

    if (data.checked) {
      dCollection.push(data.value);
    } else {
      const dIndex = dCollection.indexOf(data.value);
      if (dIndex > -1) {
        dCollection.splice(dIndex, 1);
      }
    }

    this.setState({ dashboardsToMove: dCollection });
  }

  async getExistingDash(id) {
    const { sourceAdmin, destAccountId } = this.props;
    let dash = null;

    await axios({
      method: 'get',
      url: 'https://api.newrelic.com/v2/dashboards/' + id.toString() + '.json',
      headers: { 'X-Api-Key': sourceAdmin, 'Content-Type': 'application/json' },
    }).then((resp) => {
      if (resp.status == 200) {
        dash = resp.data.dashboard;
        for (let widget of dash.widgets) {
          widget.account_id = Number(destAccountId)
          for (let key in widget.layout) { //check if insights or NR1 column layout
            if (widget.layout[key] > 3) {
              dash.grid_column_count = 12;
              break;
            }
          }
        }
      }
    }).catch((error) => {
      console.debug(error);
    })

    return dash;
  }

  async createNewDash(dashboard) {
    const { destAdmin } = this.props;
    let targetDash = null;

    await axios({
      method: 'post',
      url: 'https://api.newrelic.com/v2/dashboards.json',
      headers: { 'X-Api-Key': destAdmin, 'Content-Type': 'application/json' },
      data: {"dashboard": dashboard}
    }).then((resp) => {
      if (resp.status == 200) {
        targetDash = resp.data.dashboard;
      }
    }).catch((error) => {
      console.debug(error);
    })

    return targetDash;
  }

  async updateFacetLink(d) {
    const { destAdmin } = this.props;
    let updatedLink = null;

    await axios({
      method: 'put',
      url: 'https://api.newrelic.com/v2/dashboards/' + d.id.toString() + '.json',
      headers: { 'X-Api-Key': destAdmin, 'Content-Type': 'application/json' },
      data: {"dashboard": d}
    }).then((resp) => {
      if (resp.status == 200) {
        updatedLink = resp.data.dashboard;
      }
    }).catch((error) => {
      console.debug(error);
    })

    return updatedLink;
  }

  async moveDashboards(){
    const { sourceDashboards, dashboardsToMove } = this.state;
    let runResult = [];
    let overallResults = [];
    let currentIndex = 0;
    let dashCopy = [...sourceDashboards];

    this.setState({
      migrating: true
    })

    for (let dash of dashboardsToMove) {
      let existingDash = await this.getExistingDash(dash);
      let newDash = await this.createNewDash(existingDash);
      if (newDash == null) {
        let dashCreation = {"dashboard": {name: existingDash.title, status: "Failed"}}
        runResult.push(dashCreation);
      } else {
        for (let w of newDash.widgets) {
          if (w.presentation.drilldown_dashboard_id && w.presentation.drilldown_dashboard_id !== null) {
            w.presentation.drilldown_dashboard_id = newDash.id;
          }
        }
        let updatedDash = await this.updateFacetLink(newDash);
        if (updatedDash == null) {
          let dashCreation = {"dashboard": {name: existingDash.title, status: "Partial Success", reason: 'Facet links missing.'}};
          runResult.push(dashCreation);
        } else {
          let dashCreation = {"dashboard": {name: existingDash.title, status: "Success"}};
          runResult.push(dashCreation);
        }
      }
    }

    await this.getAllDashboards();

    await this.setState({
      dashStatus: runResult,
      dashboardsToMove: [],
      migrating: false
    })
  }

  renderDashboards() {
    let {sourceDashboards, dashboardsToMove, dashCol,
        dashDirection, allDashChecked, searchText } = this.state;

    return (
      <>
      <div
        style={{
          overflowY: 'scroll',
          height: '500px',
          display: sourceDashboards.length === 0 || sourceDashboards == null ? 'none' : 'flex'
        }}
      >
        <Table sortable compact celled definition>
          <Table.Header>
            <Table.Row>
              <Table.Cell>
              <Checkbox
              indeterminate={dashboardsToMove.length > 0 && allDashChecked == false}
              className="check"
              onChange={this.handleDashMasterCheck}
              checked={allDashChecked}
              />
              </Table.Cell>
              <Table.HeaderCell sorted={dashCol === 'id' ? dashDirection : null} onClick={this.handleDashSort('id')}>ID</Table.HeaderCell>
              <Table.HeaderCell sorted={dashCol === 'title' ? dashDirection : null} onClick={this.handleDashSort('title')}>Name</Table.HeaderCell>
              <Table.HeaderCell sorted={dashCol === 'owner' ? dashDirection : null} onClick={this.handleDashSort('owner')}>Owner</Table.HeaderCell>
              <Table.HeaderCell sorted={dashCol === 'status' ? dashDirection : null} onClick={this.handleDashSort('status')}>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {
              sourceDashboards.filter(d =>
                d.title ?
                d.title.toLowerCase().includes(searchText.toLowerCase())
                : false
              ).map((d, i) => {
                return (
                  <Table.Row key={i} disabled={d.status == "Moved"}>
                    <Table.Cell collapsing singleLine>
                      <Checkbox
                        id={i}
                        disabled={d.status == "Moved"}
                        className="check"
                        value={d.id}
                        onChange={this.handleDashCheck}
                        checked={dashboardsToMove.includes(d.id) === true && d.status !== "Moved"}
                      />
                    </Table.Cell>
                    <Table.Cell>{d.id}</Table.Cell>
                    <Table.Cell>{d.title}</Table.Cell>
                    <Table.Cell>{d.owner_email}</Table.Cell>
                    {d.status ? <Table.Cell positive><Icon name='checkmark' />{d.status}</Table.Cell> : <Table.Cell negative><Icon name='attention' />Not Moved</Table.Cell>}
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

  getContentColor = (dStatus) => {
    switch (dStatus) {
      case "Success":
        return {color: 'green'};
      case "Partial Success":
        return {color: 'orange'};
      case "Failed":
        return {color: 'red'};
    }
  }

  renderLog() {
    const { dashStatus, displayLog } = this.state;

    return (
      <>
      <Modal size='small' open={displayLog} onClose={() => this.setState({displayLog: false})} closeIcon>
        <Modal.Header>Run Log</Modal.Header>
        <Modal.Content scrolling>
        <>
          {
            dashStatus.length > 0 ?
              dashStatus.map(d => {
                return (
                  <Segment>
                    <List>
                    <List.Item>
                      <List.Header style={this.getContentColor(d.dashboard.status)}>Dashboard: {d.dashboard.name} - {d.dashboard.status} {d.dashboard.reason ? - d.dashboard.reason : null}</List.Header>
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


  render() {
    let { loading, migrating, sourceDashboards, dashboardsToMove, dashProgress, displayLog } = this.state;
    let { sourceAdmin, destAdmin, destAccountId } = this.props;

    return (
      <>
        <Dimmer active={migrating}>
          <Loader size='medium'>Working</Loader>
        </Dimmer>
        <Button style={{ float: "right" }} color='black' onClick={this.displayRunLog}>View Run Log</Button>
        {displayLog ? this.renderLog() : ''}
        { dashProgress == null ? '' : <Progress className="dashProgress" size='small' precision={1} percent={dashProgress} indicating/> }
        { sourceAdmin == null || sourceAdmin == '' || destAdmin == null || destAdmin == '' || destAccountId == null || destAccountId == '' ?
          <Button disabled size='small' color='black'>Fetch Dashboards</Button>
          :
          <Button size='small' color='black' onClick={() => this.getAllDashboards()}>Fetch Dashboards</Button>
        }
        <Input style={{marginLeft: "20px"}} icon='search' placeholder='Search Dashboards...' onChange={e => this.setState({ searchText: e.target.value })} />
        <br />
        <br />
        {sourceDashboards.length === 0 ? <Loader active={loading} size='small'>Fetching Dashboards</Loader> : this.renderDashboards()}
        {dashboardsToMove.length > 0 ?
          <>
          {
            destAdmin == null || destAdmin == "" ?
            <Button disabled style={{marginTop: "20px"}} size='small' color='green'>Migrate Dashboards</Button>
            :
            <Button style={{marginTop: "20px"}} size='small' color='green' onClick={() => this.moveDashboards()}>Migrate Dashboards</Button>
          }
          </>
          :
          ''
        }
      </>
    )
  }
}
