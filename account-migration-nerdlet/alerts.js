import axios from 'axios';
import React from 'react';
import { Icon, Tab, Label, Divider, Input, Button, Table, Checkbox, Modal, Dimmer, Loader, Progress, List, Segment } from 'semantic-ui-react';
import { NerdGraphQuery, NerdGraphMutation, Toast } from 'nr1';
import _ from 'lodash'
const gqlQuery = require('./alert-utils');


export default class Alerts extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      policies: [],
      policiesToMove: [],
      channels: [],
      channelsToMove: [],
      destPolicies: [],
      policiesToReceiveChannels: [],
      openChannelMenu: false,
      loading: false,
      sourcePoliciesLoad: false,
      destPoliciesLoad: false,
      channelsLoad: false,
      polStatus: [],
      polProgress: null,
      chanStatus: [],
      chanProgress: null,
      displayLog: false,
      polSearchText: '',
      polDirection: null,
      polColumn: null,
      chanSearchText: '',
      chanDirection: null,
      chanColumn: null,
      destSearchText: '',
      destDirection: null,
      destColumn: null,
      allChecked: false,
      allChannelChecked: false,
      allDestChecked: false
    }
    this.getPolicies = this.getPolicies.bind(this);
  }

  handleChannelMenuClose = () => this.setState({ openChannelMenu: false, destPolicies: [], policiesToReceiveChannels: [] })
  handleTabChange = (e, data) => this.setState({ policiesToMove: [], channelsToMove: [], destPolicies: [], policiesToReceiveChannels: [] })

  handleMasterCheck = (e, data) => {
    const { policiesToMove, policies } = this.state;
    let collection = policiesToMove;

    if (data.checked) {
      this.setState({ allChecked: true })

      if (policiesToMove.length > 0) {
        collection = []
      }

      for (let p of policies) {
        if (p.status !== "Moved") {
          collection.push(p.id)
        }
      }
    } else {
      this.setState({ allChecked: false, policiesToMove: [] })
    }
  }

  handleChannelMasterCheck = (e, data) => {
    const { channelsToMove, channels } = this.state;
    let collection = channelsToMove;

    if (data.checked) {
      this.setState({ allChannelChecked: true })

      if (channelsToMove.length > 0) {
        collection = []
      }

      for (let c of channels) {
        if (c.status !== "Moved") {
          if (c.type == "email" || c.type == "webhook") {
            collection.push(c.id)
          }
        }
      }
    } else {
      this.setState({ allChannelChecked: false, channelsToMove: [] })
    }
  }

  handleDestMasterCheck = (e, data) => {
    const { policiesToReceiveChannels, destPolicies } = this.state;
    let collection = policiesToReceiveChannels;

    if (data.checked) {
      this.setState({ allDestChecked: true })

      if (policiesToReceiveChannels.length > 0) {
        collection = []
      }

      for (let p of destPolicies) {
        collection.push(p.id)
      }
    } else {
      this.setState({ allDestChecked: false, policiesToReceiveChannels: [] })
    }
  }

  handleCheck = (e, data) => {
    const { policiesToMove } = this.state;
    let collection = policiesToMove;

    if (data.checked) {
      collection.push(data.value)
    } else {
      const index = collection.indexOf(data.value);
      if (index > -1) {
        collection.splice(index, 1);
      }
    }

    this.setState({
      policiesToMove: collection
    })
  }

  handleDestCheck = (e, data) => {
    const { policiesToReceiveChannels } = this.state;
    let dCollection = policiesToReceiveChannels;

    if (data.checked) {
      dCollection.push(data.value)
    } else {
      const dIndex = dCollection.indexOf(data.value);
      if (dIndex > -1) {
        dCollection.splice(dIndex, 1);
      }
    }

    this.setState({
      policiesToReceiveChannels: dCollection
    })
  }

  handleChannelCheck = (e, data) => {
    const { channelsToMove } = this.state;
    let cCollection = channelsToMove;

    if (data.checked) {
      cCollection.push(data.value)
    } else {
      const cIndex = cCollection.indexOf(data.value);
      if (cIndex > -1) {
        cCollection.splice(cIndex, 1);
      }
    }

    this.setState({
      channelsToMove: cCollection
    })
  }

  async validateStatus() {
    const { policies, destPolicies } = this.state;
    let polCopy = [...policies];
    let destPolCopy = [...destPolicies];

    for (var z=0; z < polCopy.length; z++) {
      for (var y=0; y < destPolCopy.length; y++) {
        if (polCopy[z].name == destPolCopy[y].name) {
          polCopy[z].status = "Moved"
          break;
        }
      }
    }

    this.setState({
      policies: polCopy
    }, () => {
      this.getPolicyCalculation()
    })

  }

  async getDestinationAccountPolicies() {
    const { destAccountId } = this.props;
    await this.setState({
      openChannelMenu: true,
      destPoliciesLoad: true
    })

    let res = await NerdGraphQuery.query({query: gqlQuery.getPolicies(destAccountId)});

    if (res.errors) {
      console.debug(res.errors);
      Toast.showToast({
        title: 'Policy Retrieval Error. Please check accountId specified',
        description: res.errors[0].message,
        type: Toast.TYPE.CRITICAL
      })
      this.setState({destPoliciesLoad: false})
    } else {
      await this.setState({
        destPolicies: res.data.actor.account.alerts.policiesSearch.policies,
        destPoliciesLoad: false
      })
    }
  }

  async getPolicies(){
    const { sourceAccountId, destAccountId } = this.props;

    this.setState({
      sourcePoliciesLoad: true,
      policies: []
    });

    const promises = [NerdGraphQuery.query({query: gqlQuery.getPolicies(sourceAccountId)}), NerdGraphQuery.query({query: gqlQuery.getPolicies(destAccountId)})];

    Promise.all(promises).then(values => {
      if (values[0].errors) {
        console.debug(values[0].errors);
        Toast.showToast({
          title: 'Policy Retrieval Error [Source Account]. Please check source accountId specified',
          description: values[0].errors[0].message,
          type: Toast.TYPE.CRITICAL
        })
        this.setState({sourcePoliciesLoad: false})
      } else if (values[1].errors) {
        console.debug(values[1].errors);
        Toast.showToast({
          title: 'Policy Retrieval Error [Target Account]. Please check target accountId specified',
          description: values[1].errors[0].message,
          type: Toast.TYPE.CRITICAL
        })
        this.setState({destPoliciesLoad: false, sourcePoliciesLoad: false})
      } else {
        this.setState({
          policies: values[0].data.actor.account.alerts.policiesSearch.policies,
          destPolicies: values[1].data.actor.account.alerts.policiesSearch.policies,
          sourcePoliciesLoad: false
        }, () => {
          this.validateStatus();
        })
      }
    })
  }

  handlePolicySort = (clickedColumn) => () => {
   const { polColumn, policies, polDirection } = this.state

   if (polColumn !== clickedColumn) {
     this.setState({
       polColumn: clickedColumn,
       policies: _.sortBy(policies, [clickedColumn]),
       polDirection: 'ascending',
     })

     return
   }

   this.setState({
     policies: policies.reverse(),
     polDirection: polDirection === 'ascending' ? 'descending' : 'ascending',
   })
 }

  renderPolicies(){
    let { policies, policiesToMove, polColumn, polDirection } = this.state;

      return (
        <>
        <div
          style={{
            overflowY: 'scroll',
            height: '500px',
            display: policies.length === 0 ? 'none' : ''
          }}
        >
          <Table sortable compact celled definition>
            <Table.Header>
              <Table.Row>
                <Table.Cell>
                  <Checkbox
                  indeterminate={policiesToMove.length > 0 && this.state.allChecked ==  false}
                  className="check"
                  onChange={this.handleMasterCheck}
                  checked={this.state.allChecked}
                  />
                </Table.Cell>
                <Table.HeaderCell sorted={polColumn === 'id' ? polDirection : null} onClick={this.handlePolicySort('id')}>ID</Table.HeaderCell>
                <Table.HeaderCell sorted={polColumn === 'name' ? polDirection : null} onClick={this.handlePolicySort('name')}>Policy Name</Table.HeaderCell>
                <Table.HeaderCell>Incident Preference</Table.HeaderCell>
                <Table.HeaderCell sorted={polColumn === 'status' ? polDirection : null} onClick={this.handlePolicySort('status')}>Status</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {
                policies.filter(pol =>
                  pol.name ?
                  pol.name.toLowerCase().includes(this.state.polSearchText.toLowerCase())
                  : false
                ).map((pol, i) => {
                  return (
                    <Table.Row disabled={pol.status} key={i}>
                      <Table.Cell collapsing singleLine>
                      {
                      <Checkbox
                        id={i}
                        disabled={pol.status}
                        className="check"
                        value={pol.id}
                        onChange={this.handleCheck}
                        checked={policiesToMove.includes(pol.id) === true && pol.status !== "Moved"}
                      />
                      }
                      </Table.Cell>
                      <Table.Cell>{pol.id}</Table.Cell>
                      <Table.Cell>{pol.name}</Table.Cell>
                      <Table.Cell>{pol.incidentPreference}</Table.Cell>
                      {pol.status ? <Table.Cell positive><Icon name='checkmark'/>{pol.status}</Table.Cell> : <Table.Cell negative><Icon name='attention'/>Not Moved</Table.Cell>}
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

  renderDestPolicies() {
    let { destPolicies, policiesToReceiveChannels } = this.state;

      return (
        <>
        <div
          style={{
            overflowY: 'scroll',
            height: '500px',
            display: destPolicies.length === 0 ? 'none' : ''
          }}
        >
          <Table compact celled definition>
            <Table.Header>
              <Table.Row>
                <Table.Cell>
                <Checkbox
                  className="check"
                  indeterminate={policiesToReceiveChannels.length > 0 && this.state.allDestChecked == false}
                  onChange={this.handleDestMasterCheck}
                  checked={this.state.allDestChecked}
                />
                </Table.Cell>
                <Table.HeaderCell>ID</Table.HeaderCell>
                <Table.HeaderCell>Policy Name</Table.HeaderCell>
                <Table.HeaderCell>Incident Preference</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {
                destPolicies.filter(dPol =>
                  dPol.name ?
                  dPol.name.toLowerCase().includes(this.state.destSearchText.toLowerCase())
                  : false
                ).map((dPol, k) => {
                  return (
                    <Table.Row key={k}>
                      <Table.Cell collapsing singleLine>
                        <Checkbox
                          className="check"
                          value={dPol.id}
                          onChange={this.handleDestCheck}
                          checked={policiesToReceiveChannels.includes(dPol.id) === true}
                        />
                      </Table.Cell>
                      <Table.Cell>{dPol.id}</Table.Cell>
                      <Table.Cell>{dPol.name}</Table.Cell>
                      <Table.Cell>{dPol.incidentPreference}</Table.Cell>
                    </Table.Row>
                  )
                })
              }
            </Table.Body>
          </Table>
        </div>
        </>
      )
  }

  async createNewPolicy(p){
    const { destAccountId } = this.props;
    let res = await NerdGraphMutation.mutate({mutation: gqlQuery.createPolicy(destAccountId, p)})
    let newId = null;

    if (res.errors) {
      console.debug(res.errors)
      Toast.showToast({
        title: 'Policy Creation Error',
        description: res.errors[0].message,
        type: Toast.TYPE.CRITICAL
      })
    } else {
      newId = res.data.alertsPolicyCreate.id;
    }

    return newId;
  }

  async getApmConditions(p) {
    const apm_api = 'https://api.newrelic.com/v2/alerts_conditions.json'
    const payload = { 'policy_id': p[0].id.toString() }
    let conds = []

    await axios({
      method: 'get',
      url: apm_api,
      headers: {
        'X-Api-Key': this.props.sourceAdmin
      },
      params: payload
    }).then(resp => {
      conds.push(resp.data);
    }).catch((error) => {
      console.debug(error);
      Toast.showToast({
        title: 'APM Condition Retrieval Error',
        description: error,
        type: Toast.TYPE.CRITICAL
      })
    })

    return conds;
  }

  async getEntitiesFromExisting(existingEntities) {
    let existingAppNames = [];
    let get_old_apm_entities = 'https://api.newrelic.com/v2/applications.json';
    existingEntities = existingEntities.join(",")

    await axios({
      url: get_old_apm_entities,
      method: 'get',
      headers: {
        'X-Api-Key': this.props.sourceAdmin
      },
      params: { 'filter[ids]': existingEntities.toString()}
    }).then(resp => {
      if (resp.data.applications.length > 0) {
        for (let app of resp.data.applications) {
          existingAppNames.push(app.name);
        }
      }
    }).catch((error) => {
      console.debug(error);
      Toast.showToast({
        title: 'APM Entity Retrieval Error - Source',
        description: error,
        type: Toast.TYPE.CRITICAL
      })
    })

    return existingAppNames;
  }

  async getNewEntityIds(existing) {
    let newAppIDs = [];
    let get_new_apm_entities = 'https://api.newrelic.com/v2/applications.json';

    for (let n of existing) {
      await axios({
        url: get_new_apm_entities,
        method: 'get',
        headers: {
          'X-Api-Key': this.props.destAdmin
        },
        params: { 'filter[name]': n }
      }).then(resp => {
        if (resp.data.applications.length > 0) {
          newAppIDs.push(resp.data.applications[0].id);
        } else {
          console.debug("Entity: " + n + " does not exist in new account. Skipping...")
        }
      }).catch((error) => {
        console.debug(error);
        Toast.showToast({
          title: 'APM Entity Retrieval Error - Destination',
          description: error,
          type: Toast.TYPE.CRITICAL
        })
      })
    }

    return newAppIDs;
  }

  async getBrowserFromExisting(existingB) {
    let existingBNames = [];
    let get_old_browser_entities = 'https://api.newrelic.com/v2/browser_applications.json';
    existingB = existingB.join(",")

    await axios({
      url: get_old_browser_entities,
      method: 'get',
      headers: {
        'X-Api-Key': this.props.sourceAdmin
      },
      params: { 'filter[ids]': existingB.toString()}
    }).then(resp => {
      if (resp.data.browser_applications.length > 0) {
        for (let app of resp.data.browser_applications) {
          existingBNames.push(app.name);
        }
      }
    }).catch((error) => {
      console.debug(error);
      Toast.showToast({
        title: 'Browser Entity Retrieval Error - Source',
        description: error,
        type: Toast.TYPE.CRITICAL
      })
    })

    return existingBNames;
  }

  async getNewBrowserIds(existing) {
    let newBrowserIDs = [];
    let get_new_browser_entities = 'https://api.newrelic.com/v2/browser_applications.json';

    for (let b of existing) {
      await axios({
        url: get_new_browser_entities,
        method: 'get',
        headers: {
          'X-Api-Key': this.props.destAdmin
        },
        params: { 'filter[name]': b }
      }).then(resp => {
        if (resp.data.browser_applications.length > 0) {
          newBrowserIDs.push(resp.data.browser_applications[0].id);
        } else {
          console.debug("Entity: " + b + " does not exist in new account. Skipping...")
        }
      }).catch((error) => {
        console.debug(error);
        Toast.showToast({
          title: 'Browser Entity Retrieval Error - Destination',
          description: error,
          type: Toast.TYPE.CRITICAL
        })
      })
    }

    return newBrowserIDs;
  }

  async getMobileFromExisting(existingM) {
    let existingMNames = [];
    let get_old_mobile_entities = 'https://api.newrelic.com/v2/mobile_applications.json';
    existingM = existingM.join(",")

    await axios({
      url: get_old_mobile_entities,
      method: 'get',
      headers: {
        'X-Api-Key': this.props.sourceAdmin
      },
      params: { 'filter[ids]': existingM.toString()}
    }).then(resp => {
      if (resp.data.applications.length > 0) {
        for (let app of resp.data.applications) {
          existingMNames.push(app.name);
        }
      }
    }).catch((error) => {
      console.debug(error);
      Toast.showToast({
        title: 'Mobile Entity Retrieval Error - Source',
        description: error,
        type: Toast.TYPE.CRITICAL
      })
    })

    return existingMNames;
  }

  async getNewMobileIds(existing) {
    let newMobileIDs = [];
    let get_new_mobile_entities = 'https://api.newrelic.com/v2/mobile_applications.json';

    for (let m of existing) {
      await axios({
        url: get_new_mobile_entities,
        method: 'get',
        headers: {
          'X-Api-Key': this.props.destAdmin
        },
        params: { 'filter[name]': m }
      }).then(resp => {
        if (resp.data.applications.length > 0) {
          newMobileIDs.push(resp.data.applications[0].id);
        } else {
          console.debug("Entity: " + m + " does not exist in new account. Skipping...")
        }
      }).catch((error) => {
        console.debug(error);
        Toast.showToast({
          title: 'Mobile Entity Retrieval Error - Destination',
          description: error,
          type: Toast.TYPE.CRITICAL
        })
      })
    }

    return newMobileIDs;
  }

  async getKeysFromExisting(existingK) {
    let existingKNames = [];
    let get_old_key_entities = 'https://api.newrelic.com/v2/key_transactions.json';
    existingK = existingK.join(",")

    await axios({
      url: get_old_key_entities,
      method: 'get',
      headers: {
        'X-Api-Key': this.props.sourceAdmin
      },
      params: { 'filter[ids]': existingK.toString()}
    }).then(resp => {
      if (resp.data.key_transactions.length > 0) {
        for (let app of resp.data.key_transactions) {
          existingKNames.push(app.name);
        }
      }
    }).catch((error) => {
      console.debug(error);
      Toast.showToast({
        title: 'Key Tx Entity Retrieval Error - Source',
        description: error,
        type: Toast.TYPE.CRITICAL
      })
    })

    return existingKNames;
  }

  async getNewKeyIds(existing) {
    let newKeyIDs = [];
    let get_new_key_entities = 'https://api.newrelic.com/v2/key_transactions.json';

    for (let k of existing) {
      await axios({
        url: get_new_key_entities,
        method: 'get',
        headers: {
          'X-Api-Key': this.props.destAdmin
        },
        params: { 'filter[name]': k }
      }).then(resp => {
        if (resp.data.key_transactions.length > 0) {
          newKeyIDs.push(resp.data.key_transactions[0].id);
        } else {
          console.debug("Entity: " + k + " does not exist in new account. Skipping...")
        }
      }).catch((error) => {
        console.debug(error);
        Toast.showToast({
          title: 'Key Tx Entity Retrieval Error - Destination',
          description: error,
          type: Toast.TYPE.CRITICAL
        })
      })
    }

    return newKeyIDs;
  }

  postApmConditions(aConds, newPol) {
    return new Promise(async (resolve, reject) => {
      let polObj = [];
      let apm_post_api = 'https://api.newrelic.com/v2/alerts_conditions/policies/' + newPol.toString() + '.json'
      let payload = null;

      if (aConds.data.conditions.length > 0) {
        for (let cond of aConds.data.conditions) {
          delete cond.id;

          if (cond.type == 'apm_app_metric' || cond.type == 'apm_jvm_metric') {
            if (cond.entities.length > 0) { //if entities exist in current condition, check if those entities have been moved to new account
              let existingAppNames = await this.getEntitiesFromExisting(cond.entities);
              let newAppIds = await this.getNewEntityIds(existingAppNames);
              if (newAppIds.length > 0) {
                cond.entities = newAppIds;
              } else {
                cond.entities = []
              }
            }
            payload = {"condition": cond }
          } else if (cond.type == 'apm_kt_metric') {
            if (cond.entities.length > 0) {
              let existingKeyNames = await this.getKeysFromExisting(cond.entities);
              let newKeyIds = await this.getNewKeyIds(existingKeyNames);
              if (newKeyIds.length > 0) {
                cond.entities = newKeyIds;
              } else {
                cond.entities = [];
              }
            }
            payload = {"condition": cond }
          } else if (cond.type == 'browser_metric') {
            if (cond.entities.length > 0) {
              let existingBrowserNames = await this.getBrowserFromExisting(cond.entities);
              let newBrowserIds = await this.getNewBrowserIds(existingBrowserNames);
              if (newBrowserIds.length > 0) {
                cond.entities = newBrowserIds;
              } else {
                cond.entities = [];
              }
            }
            payload = {"condition": cond }
          } else if (cond.type == 'mobile_metric') {
            if (cond.entities.length > 0) {
              let existingMobileNames = await this.getMobileFromExisting(cond.entities);
              let newMobileIds = await this.getNewMobilerIds(existingMobileNames);
              if (newMobileIds.length > 0) {
                cond.entities = newMobileIds;
              } else {
                cond.entities = [];
              }
            }
            payload = {"condition": cond }
          } else {
            payload = null;
          }

         if (payload == null) {
          let condResult = {"condName": cond.name, "condType": "Unsupported", "status": "Failed"}
          polObj.push(condResult);
         } else {
          await axios({
            method: 'post',
            url: apm_post_api,
            headers: {
              'X-Api-Key': this.props.destAdmin,
              'Content-Type': 'application/json'
            },
            data: payload
          }).then(resp => {
            let status = null;
            let reason = null;
            if (resp.status == 201) {
              status = "Success"
              if (resp.data.condition.entities.length == 0) {
                status = "Partial Success"
                reason = "No entities assigned"
              }
            } else {
              status = "Failed"
            }
            let condResult = {"condName": cond.name, "condType": cond.type, "status": status, "reason": reason}
            polObj.push(condResult);
          }).catch(error => {
            console.debug(error);
            Toast.showToast({
              title: 'APM Condition Creation Error',
              description: error,
              type: Toast.TYPE.CRITICAL
            })
          })
        } //else
      } //for
    } //if

    resolve(polObj);
  }) //promise
}

  async getExternalConditions(p) {
    let external_api = 'https://api.newrelic.com/v2/alerts_external_service_conditions.json'
    const payload = { 'policy_id': p[0].id.toString() }
    let conds = [];

    await axios({
      method: 'get',
      url: external_api,
      headers: {
        'X-Api-Key': this.props.sourceAdmin
      },
      params: payload
    }).then(resp => {
      conds.push(resp.data);
    }).catch((error) => {
      console.debug(error);
      Toast.showToast({
        title: 'APM Condition Creation Error',
        description: error,
        type: Toast.TYPE.CRITICAL
      })
    })

    return conds;
  }

  async postExternalConditions(eConds, newPol) {
    let polObj = [];
    const external_post_api = 'https://api.newrelic.com/v2/alerts_external_service_conditions/policies/' + newPol.toString() + '.json'

    for (let e of eConds.data.external_service_conditions) {
      delete e.id;

      if (e.entities.length > 0) {
        let existingAppNames = await this.getEntitiesFromExisting(e.entities);
        let newAppIds = await this.getNewEntityIds(existingAppNames);
        if (newAppIds.length > 0) {
          e.entities = newAppIds;
        } else {
          e.entities = [];
        }
      }

      let payload = {
        "external_service_condition": e
      }

      await axios({
        method: 'post',
        url: external_post_api,
        headers: {
          'X-Api-Key': this.props.destAdmin,
          'Content-Type': 'application/json'
        },
        data: payload
      }).then(resp => {
        let status = null
        if (resp.status == 201) {
          status = "Success"
        } else {
          status = "Failed"
        }
        let condResult = {"condName": e.name, "condType": e.type, "status": status}
        polObj.push(condResult);
      }).catch(error => {
        console.debug(error);
        Toast.showToast({
          title: 'External Condition Creation Error',
          description: error,
          type: Toast.TYPE.CRITICAL
        })
      })
    } //for

    return polObj;
  }

  async getSynConditions(p) {
    let syn_api = 'https://api.newrelic.com/v2/alerts_synthetics_conditions.json'
    let conds = []

    await axios({
      method: 'get',
      url: syn_api,
      headers: {
        'X-Api-Key': this.props.sourceAdmin
      },
      params: { 'policy_id': p[0].id.toString() }
    }).then(resp => {
      conds.push(resp.data);
    }).catch((error) => {
      console.debug(error);
      Toast.showToast({
        title: 'Synthetic Condition Retrieval Error',
        description: error,
        type: Toast.TYPE.CRITICAL
      })
    })

    return conds
  }

  async postSynCondition(cond, monId, p) {
    let polObj = [];
    let syn_single_api = 'https://api.newrelic.com/v2/alerts_synthetics_conditions/policies/' + p.toString() + '.json';

    delete cond.id;
    cond.monitor_id = monId
    let payload = {
      "synthetics_condition": cond
    }

    await axios({
      method: 'post',
      url: syn_single_api,
      headers: {
        'X-Api-Key': this.props.destAdmin,
        'Content-Type': 'application/json'
      },
      data: payload
    }).then(resp => {
      let status = null
      if (resp.status == 201) {
        status = "Success"
      } else {
        status = "Failed"
      }
      let condResult = {"condName": cond.name, "condType": "synthetic_single_location", "status": status}
      polObj.push(condResult);
    }).catch(error => {
      console.debug(error);
      Toast.showToast({
        title: 'Synthetic Condition Creation Error',
        description: error,
        type: Toast.TYPE.CRITICAL
      })
    })

    return polObj;

  }

  async getSynMultiConditions(p) {
    let multi_api = 'https://api.newrelic.com/v2/alerts_location_failure_conditions/policies/' + p[0].id.toString() + '.json'
    let conds = [];

    await axios({
      method: 'get',
      url: multi_api,
      headers: {
        'X-Api-Key': this.props.sourceAdmin
      }
    }).then(resp => {
      conds.push(resp.data);
    }).catch((error) => {
      console.debug(error);
      Toast.showToast({
        title: 'Synthetic Multi Condition Retrieval Error',
        description: error,
        type: Toast.TYPE.CRITICAL
      })
    })

    return conds
  }

  async postSynMultiCondition(cond, monIds, p) {
    let polObj = [];
    let syn_multi_api = 'https://api.newrelic.com/v2/alerts_location_failure_conditions/policies/' + p.toString() + '.json';

    delete cond.id;
    cond.entities= monIds
    let payload = {
      "location_failure_condition": cond
    }

    await axios({
      method: 'post',
      url: syn_multi_api,
      headers: {
        'X-Api-Key': this.props.destAdmin,
        'Content-Type': 'application/json'
      },
      data: payload
    }).then(resp => {
      let status = null
      if (resp.status == 201) {
        status = "Success"
      } else {
        status = "Failed"
      }
      let condResult = {"condName": cond.name, "condType": "synthetic_multi_location_metric", "status": status}
      polObj.push(condResult);
    }).catch(error => {
      console.debug(error);
      Toast.showToast({
        title: 'Synthetic Condition Creation Error',
        description: error,
        type: Toast.TYPE.CRITICAL
      })
    })

    return polObj;

  }

  //Obtain existing monitor name based on guid
  async getExistingSynName(s) {
    var entityId = btoa(this.props.sourceAccountId + '|SYNTH|MONITOR|' + s.monitor_id).replace(/={1,2}$/, '');

    let res = await NerdGraphQuery.query({query: gqlQuery.getSyntheticMonitor(entityId)});

    return res.data.actor.entity.name;
  }

  async getExistingSynNames(m) {
    let names = [];

    for (entityId of m.entities) {
      var entityId = btoa(this.props.sourceAccountId + '|SYNTH|MONITOR|' + entityId).replace(/={1,2}$/, '');
      let res = await NerdGraphQuery.query({query: gqlQuery.getSyntheticMonitor(entityId)});
      names.push(res.data.actor.entity.name);
    }

    return names;
  }

  //Obtain new monitor id by name (assuming it has been moved to new account)
  async getNewSynId(currentName) {
    var accountId = this.props.destAccountId;

    let res = await NerdGraphQuery.query({query: gqlQuery.getNewSyntheticId(currentName, accountId)});

    if (res.data.actor.entitySearch.results.entities.length > 0){
      return res.data.actor.entitySearch.results.entities[0].monitorId;
    } else {
      return null;
    }
  }

  async getNewSynIds(currentNames) {
    var accountId = this.props.destAccountId
    let newIds = [];

    for (name of currentNames) {
      let res = await NerdGraphQuery.query({query: gqlQuery.getNewSyntheticId(name, accountId)});
      if (res.data.actor.entitySearch.results.entities.length > 0) {
        newIds.push(res.data.actor.entitySearch.results.entities[0].monitorId)
      }
    }

    return newIds;
  }

  async getNrqlConditions(p) {
    let res = await NerdGraphQuery.query({query: gqlQuery.getNrqlConditions(this.props.sourceAccountId, p[0].id)})

    if (res.errors) {
      console.debug(res.errors);
      Toast.showToast({
        title: 'NRQL Condition Retrieval Error',
        description: res.errors[0].message,
        type: Toast.TYPE.CRITICAL
      })
      return null;
    } else {
      return res.data.actor.account.alerts.nrqlConditionsSearch.nrqlConditions
    }
  }

  postNrqlConditions(c, newPol){ //TODO: better error handling
    let status = null;
    let polObj = [];

    for (let cond of c) {
      if (cond.type == "BASELINE") {
        let baselineResult = NerdGraphMutation.mutate({mutation: gqlQuery.createBaselineNrqlCondition(this.props.destAccountId, cond, newPol)});
        if (baselineResult.errors) {
          status = "Failed"
        } else {
          status = "Success"
        }
        let condResult = {"condName": cond.name, "condType": cond.type, "status": status}
        polObj.push(condResult);
      } else if (cond.type == "OUTLIER") {
        let outlierResult =  NerdGraphMutation.mutate({mutation: gqlQuery.createOutlierNrqlCondition(this.props.destAccountId, cond, newPol)});
        if (outlierResult.errors) {
          status = "Failed"
        } else {
          status = "Success"
        }
        let condResult = {"condName": cond.name, "condType": cond.type, "status": status}
        polObj.push(condResult);
      } else if (cond.type == "STATIC") {
        let staticResult = NerdGraphMutation.mutate({mutation: gqlQuery.createStaticNrqlCondition(this.props.destAccountId, cond, newPol)});
        if (staticResult.errors) {
          status = "Failed"
        } else {
          status = "Success"
        }
        let condResult = {"condName": cond.name, "condType": cond.type, "status": status}
        polObj.push(condResult);
      }
    }

    return polObj;
  }

  async postWithEntities(type, conds, newPolId) {
    let polObj = [];

    switch(type) {
      case "synth_single":
        for (let s of conds.data.synthetics_conditions) {
          let singleName = await this.getExistingSynName(s);
          let singleId = await this.getNewSynId(singleName)
          if (singleId == null) {
            console.debug("Monitor " + singleName + " has not been moved to new account. Skipping...")
            let condResult = {"condName": s.name, "condType": "synthetic_single_location", "status": "Failed", "reason": "Monitor does not exist in target account"}
            polObj.push(condResult);
          } else {
            let synResults = await this.postSynCondition(s, singleId, newPolId);
            return synResults;
          }
        }
        return polObj;
      case "synth_multi":
        for (let m of conds.data.location_failure_conditions) {
          let names = await this.getExistingSynNames(m);
          let ids = await this.getNewSynIds(names);
          if (ids.length > 0) {
            let synMultiResults = await this.postSynMultiCondition(m, ids, newPolId);
            return synMultiResults;
          } else {
            console.debug("Monitors have not been moved to new account. Skipping...");
            let condResult = {"condName": m.name, "condType": "synthetic_multi_location", "status": "Failed", "reason": "One or more monitors do not exist in target account"}
            polObj.push(condResult);
          }
        }
        return polObj;
    }
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

  getAndPushConditions(aPol, newPol) {
    return new Promise((resolve, reject) => {
        const apmConds = axios.get('https://api.newrelic.com/v2/alerts_conditions.json',
        { headers: { 'X-Api-Key': this.props.sourceAdmin }, params: { 'policy_id': aPol[0].id.toString() }});

        const externalConds = axios.get('https://api.newrelic.com/v2/alerts_external_service_conditions.json',
        { headers: { 'X-Api-Key': this.props.sourceAdmin }, params: { 'policy_id': aPol[0].id.toString() }});

        const synSingleConds = axios.get('https://api.newrelic.com/v2/alerts_synthetics_conditions.json',
        { headers: { 'X-Api-Key': this.props.sourceAdmin }, params: { 'policy_id': aPol[0].id.toString() }});

        const synMultiConds = axios.get('https://api.newrelic.com/v2/alerts_location_failure_conditions/policies/' + aPol[0].id.toString() + '.json',
        { headers: { 'X-Api-Key': this.props.sourceAdmin }});

        //CORS issue
        // const infraConds = axios.get('https://infra-api.newrelic.com/v2/alerts/conditions?policy_id=' + aPol[0].id.toString(),
        // { headers: { 'X-Api-Key': this.props.sourceAdmin }})
        // console.log(infraConds);

        const nrqlConds = this.getNrqlConditions(aPol);

        axios.all([apmConds, externalConds, synSingleConds, synMultiConds, nrqlConds])
          .then(axios.spread((...resp) => {
            let finalResults = []
            if (resp[0].data.conditions.length > 0) {
              finalResults.push(this.postApmConditions(resp[0], newPol));
            }

            if (resp[1].data.external_service_conditions.length > 0) {
              finalResults.push(this.postExternalConditions(resp[1], newPol));
            }

            if (resp[2].data.synthetics_conditions.length > 0){
              finalResults.push(this.postWithEntities("synth_single", resp[2], newPol));
            }

            if (resp[3].data.location_failure_conditions.length > 0) {
              finalResults.push(this.postWithEntities("synth_multi", resp[3], newPol))
            }

            if (resp[4] !== null) {
              finalResults.push(this.postNrqlConditions(resp[4], newPol))
            }

            Promise.all(finalResults).then(results => {
              resolve(results.flat())
            })
          })).catch(err => {
            console.debug(err);
          })
      })//promise
  }

  async movePolicies(){
    const { policies, policiesToMove, entitiesMoved } = this.state;
    let runResult = [];
    let pushResults = [];
    let currentIndex = 0;
    let policyCopy = [...policies];

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
      for (let pol of policiesToMove) {
        let aPol = await policyCopy.filter(p => {
          return p.id === pol;
        })

        let currentName = aPol[0].name;
        let newPolId = await this.createNewPolicy(aPol[0]);

        if (newPolId == null) {
          let polCreation = {"policy": {name: currentName, status: "Failed"}}
          runResult.push(polCreation);
        } else {
          let polCreation = {"policy": {name: currentName, status: "Success"}, conditions: []}
          runResult.push(polCreation);
          pushResults.push(this.getAndPushConditions(aPol, newPolId));
        } //else
      } //for
      await Promise.all(pushResults).then(res => {
        let currentIndex = 0;
        for (let r of runResult) {
          r.conditions = res[currentIndex];
          currentIndex += 1;
        }
      })
    } // else

    await this.getPolicies();

    await this.setState({
      polStatus: runResult,
      policiesToMove: [],
      loading: false
    })

  }

  async getAllSourceChannels() { //TODO: add pagination
    const channel_api = 'https://api.newrelic.com/v2/alerts_channels.json';
    let channels = null;
    let cycle = 0;

    let payload = {'page': cycle}
    await axios({
      method: 'get',
      url: channel_api,
      headers: {'X-Api-Key': this.props.sourceAdmin},
      params: payload
    }).then((resp) => {
      if (resp.status == 200) {
        channels = resp.data.channels;
      }
    }).catch((error) => {
      console.debug(error);
      Toast.showToast({
        title: 'Source Account Dashboard Retrieval Error. Please check source admin key.',
        description: "Check console debug logs.",
        type: Toast.TYPE.CRITICAL
      })
    })

    return channels;
  }

  async getAllDestChannels() { //TODO: add pagination
    const channel_api = 'https://api.newrelic.com/v2/alerts_channels.json';
    let channels = null;
    let cycle = 0;

    let payload = {'page': cycle}
    await axios({
      method: 'get',
      url: channel_api,
      headers: {'X-Api-Key': this.props.destAdmin},
      params: payload
    }).then((resp) => {
      if (resp.status == 200) {
        channels = resp.data.channels;
      }
    }).catch((error) => {
      console.debug(error);
      Toast.showToast({
        title: 'Destination Account Dashboard Retrieval Error. Please check destination admin key.',
        description: "Check console debug logs.",
        type: Toast.TYPE.CRITICAL
      })
    })

    return channels;
  }

  async getAllChannels() {
    this.setState({ channels: [], channelsLoad: true });
    let promises = [this.getAllSourceChannels(), this.getAllDestChannels()]

    Promise.all(promises).then(resp => {
      let srcChannels = resp[0];
      let dstChannels = resp[1];

      if (srcChannels == null || dstChannels == null) {
        console.debug("Unable to retrieve account channels");
        this.setState({channelsLoad: false})
      } else {
        for (var s=0; s < srcChannels.length; s++) {
          for (var d=0; d < dstChannels.length; d++) {
            if (srcChannels[s].name == dstChannels[d].name) {
              srcChannels[s].status = "Moved";
              break;
            }
          }
        }
        this.setState({
          channels: srcChannels,
          channelsLoad: false
        }, () => {
          this.getChannelCalculation();
        })
      }
    })
  }

  handleChannelSort = (clickedColumn) => () => {
   const { chanColumn, channels, chanDirection } = this.state

   if (chanColumn !== clickedColumn) {
     this.setState({
       chanColumn: clickedColumn,
       channels: _.sortBy(channels, [clickedColumn]),
       chanDirection: 'ascending',
     })

     return
   }

   this.setState({
     channels: channels.reverse(),
     chanDirection: chanDirection === 'ascending' ? 'descending' : 'ascending',
   })
 }

  renderChannels() {
    let { channels, channelsToMove, chanColumn, chanDirection } = this.state;

      return (
        <>
        <div
          style={{
            overflowY: 'scroll',
            height: '500px',
            display: channels.length === 0 || channels == null ? 'none' : 'flex'
          }}
        >
          <Table sortable compact celled definition>
            <Table.Header>
              <Table.Row>
                <Table.Cell>
                <Checkbox
                indeterminate={channelsToMove.length > 0 && this.state.allChannelChecked == false}
                className="check"
                onChange={this.handleChannelMasterCheck}
                checked={this.state.allChannelChecked}
                />
                </Table.Cell>
                <Table.HeaderCell sorted={chanColumn === 'id' ? chanDirection : null} onClick={this.handleChannelSort('id')}>ID</Table.HeaderCell>
                <Table.HeaderCell sorted={chanColumn === 'name' ? chanDirection : null} onClick={this.handleChannelSort('name')}>Channel Name</Table.HeaderCell>
                <Table.HeaderCell sorted={chanColumn === 'type' ? chanDirection : null} onClick={this.handleChannelSort('type')}>Channel Type</Table.HeaderCell>
                <Table.HeaderCell sorted={chanColumn === 'status' ? chanDirection : null} onClick={this.handleChannelSort('status')}>Status</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {
                channels.filter(c =>
                  c.name ?
                  c.name.toLowerCase().includes(this.state.chanSearchText.toLowerCase())
                  : false
                ).map((c, i) => {
                  return (
                    <Table.Row key={i} disabled={c.status == "Moved" || c.type == "pagerduty" || c.type == "slack" || c.type == "victorops" || c.type == "opsgenie" || c.type == "user"}>
                      <Table.Cell collapsing singleLine>
                        <Checkbox
                          id={i}
                          disabled={c.status == "Moved" || c.type == "pagerduty" || c.type == "slack" || c.type == "victorops" || c.type == "opsgenie" || c.type == "user"}
                          className="check"
                          value={c.id}
                          onChange={this.handleChannelCheck}
                          checked={channelsToMove.includes(c.id) === true && c.status !== "Moved"}
                        />
                      </Table.Cell>
                      <Table.Cell>{c.id}</Table.Cell>
                      <Table.Cell>{c.name}</Table.Cell>
                      <Table.Cell>{c.type}</Table.Cell>
                      {c.status ? <Table.Cell positive><Icon name='checkmark' />{c.status}</Table.Cell> : <Table.Cell negative><Icon name='attention' />Not Moved</Table.Cell>}
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

  //assume users are already moved (similar to entities)
  async moveChannels(moveType) {
    const { channelsToMove, channelStatus } = this.state;
    let channelCopy = [...this.state.channels];
    let createdChannels = [];
    let chanRunStatus = [];

    await this.setState({
      openChannelMenu: false,
      loading: true,
    })


    for (let chan of channelsToMove) {
      let aChan = await channelCopy.filter(c => {
        return c.id === chan;
      })
      let aChanCopy = {...aChan[0]};
      let chanName = aChan[0].name;

      // if (aChanCopy.type == 'user') {
      //   createdChannels.push(aChanCopy.id)
      // }

      let newChannel = await this.createChannel(aChanCopy)
      if (newChannel !== null || newChannel.id !== null) {
        createdChannels.push(newChannel.id)
        chanRunStatus.push({"channel": {"name": chanName, "status": "Success", "policies": []}})
      } else {
        chanRunStatus.push({"channel": {"name": chanName, "status": "Failed"}})
      }
    }

    if (moveType == "attach") {
      let attachResult = await this.attachChannelsToPolicies(createdChannels);
      for (let c of chanRunStatus) {
        c.channel.policies = attachResult;
      }
    }

    this.getAllChannels();

    this.setState({
      channelsToMove: [],
      destPolicies: [],
      policiesToReceiveChannels: [],
      loading: false,
      chanStatus: chanRunStatus
    })
  }

  async createChannel(c) {
    const channel_create_api = 'https://api.newrelic.com/v2/alerts_channels.json';
    let newChannel = null;

    delete c.id
    delete c.links

    if (c.configuration.headers == "") {
      delete c.configuration.headers
    }

    if (c.configuration.auth_username) {
      c.configuration.auth_password= "abc123";
    }

    let payload = {
      "channel": c
    }

    //cannot create user type channel - specified at account level.
    //slack, pagerduty, victorops, etc GET calls do not return all information required, skipping for now
    if (c.type == "email" || c.type == "webhook") {
      await axios({
        method: 'post',
        url: channel_create_api,
        headers: {
          'X-Api-Key': this.props.destAdmin,
          'Content-Type': 'application/json'
        },
        data: payload
      }).then(resp => {
        if (resp.status == 201) {
          newChannel = resp.data.channels[0];
        }
      }).catch(error => {
        console.debug("Channel " + c.name + " failed to create. Please see error below:");
        console.debug(error)
      })
    }

    return newChannel;
  }

  async attachChannelsToPolicies(newChans) {
    const { policiesToReceiveChannels } = this.state;
    let attachObj = [];
    let policy_update_api = 'https://api.newrelic.com/v2/alerts_policy_channels.json';
    newChans = newChans.join(",");

    for (let pol of policiesToReceiveChannels) {
      let prms = {'policy_id': pol.toString(), 'channel_ids': newChans.toString() }
      await axios({
        method: 'put',
        url: policy_update_api,
        headers: {
          'X-Api-Key': this.props.destAdmin,
          'Content-Type': 'application/json'
        },
        data: prms
      }).then(resp => {
        let status = null;
        if (resp.status == 200) {
          status = "Success";
        } else {
          status = "Failed"
        }
        let attachResult = {"policyId": pol, "status": status}
        attachObj.push(attachResult);
      }).catch(error => {
        console.debug(error)
      })
    }

    return attachObj;
  }

  async getPolicyCalculation() {
    const { policies } = this.state;
    let polCopy = [...policies]

    let polsMoved = await polCopy.filter(p => {
      return p.status;
    });
    let status = (polsMoved.length / policies.length)*100

    this.setState({
      polProgress: status
    })
  }

  async getChannelCalculation() {
    const { channels } = this.state;
    let chanCopy = [...channels];

    let chansMoved = await chanCopy.filter(c => {
      return c.status;
    })
    let status = (chansMoved.length / channels.length)*100

    this.setState({
      chanProgress: status
    })
  }

  displayRunLog = () => {
    this.setState({
      displayLog: true
    })
  }

  getContentColor = (cond) => {
    switch (cond.status) {
      case "Success":
        return {color: 'green'};
      case "Partial Success":
        return {color: 'orange'};
      case "Failed":
        return {color: 'red'};
    }
  }

  renderLog() {
    const { polStatus, chanStatus } = this.state;
    let polLogs = null;

    return (
      <>
      <Modal size='small' open={this.state.displayLog} onClose={() => this.setState({displayLog: false})} closeIcon>
        <Modal.Header>Run Log</Modal.Header>
        <Modal.Content scrolling>
        <>
          {
            polStatus.length > 0 ?
              polStatus.map(p => {
                return (
                  <Segment>
                    <List>
                    <List.Item>
                      <List.Header style={p.policy.status == "Success" ? {color: 'green'} : {color: 'red'}}>Policy: {p.policy.name} - {p.policy.status}</List.Header>
                    </List.Item>
                    {
                      p.conditions.map(c => {
                        return (
                          <List.Item style={this.getContentColor(c)}
                          content={c.status == "Success" ? <p>Condition: {c.condName} - {c.status}</p> : <p>Condition: {c.condName} - {c.status} - {c.reason}</p>} />
                        )
                      })
                    }
                    </List>
                  </Segment>
                )
              })
              :
              ''
          }
          {
            chanStatus.length > 0 ?
              chanStatus.map(chan => {
                return (
                  <Segment>
                    <List>
                    <List.Item>
                      <List.Header style={chan.channel.status == "Success" ? {color: 'green'} : {color: 'red'}}>Channel: {chan.channel.name} - {chan.channel.status}</List.Header>
                    </List.Item>
                    {
                      chan.channel.policies.map(p => {
                        return (
                          <List.Item style={this.getContentColor(p)}
                          content={<p>Policy to Attach: {p.policyId} - {p.status}</p>} />
                        )
                      })
                    }
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
    let { sourceAdmin, sourceAccountId, destAdmin, destAccountId } = this.props;
    let { policies, policiesToMove, channels, channelsToMove,
    destPolicies, loading, polProgress, chanProgress } = this.state;

    const panes = [
      { menuItem: 'Policies', render: () =>
      <Tab.Pane>
        {polProgress == null ? '' : <Progress className="progress" size='small' precision={1} percent={polProgress} indicating/>}
        {sourceAdmin == null || sourceAdmin == "" || sourceAccountId == null || sourceAccountId == "" ||
         destAdmin == null || destAdmin == "" || destAccountId == null || destAccountId == "" ?
          <Button disabled size='small' color='black'>Fetch Policies</Button>
          :
          <Button size='small' color='black' onClick={() => this.getPolicies()}>Fetch Policies</Button>
        }
        <Input style={{marginLeft: "20px"}} icon='search' placeholder='Search Policies...' onChange={e => this.setState({ polSearchText: e.target.value })} />
        <br />
        <br />
        {policies.length === 0 ? <Loader active={this.state.sourcePoliciesLoad} size='small'>Fetching Policies</Loader> : this.renderPolicies()}
        {policiesToMove.length > 0 ?
          <>
          {
            destAdmin == null || destAdmin == "" || destAccountId == null || destAccountId == "" ?
            <Button disabled style={{marginTop: "20px"}} size='small' color='green'>Migrate Policies</Button>
            :
            <Button style={{marginTop: "20px"}} size='small' color='green' onClick={() => this.movePolicies()}>Migrate Policies</Button>
          }
          </>
          :
          ''
        }
      </Tab.Pane>
      },
      { menuItem: 'Notification Channels', render: () =>
      <Tab.Pane>
      {chanProgress == null ? '' : <Progress className="progress" size='small' precision={1} percent={chanProgress} indicating/>}
      {sourceAdmin == null || sourceAdmin == "" || sourceAccountId == null || sourceAccountId == "" ||
       destAdmin == null || destAdmin == "" || destAccountId == null || destAccountId == "" ?
        <Button disabled size='small' color='black'>Fetch Channels</Button>
        :
        <Button size='small' color='black' onClick={() => this.getAllChannels()}>Fetch Channels</Button>
      }
      <Input style={{marginLeft: "20px"}} icon='search' placeholder='Search Channels...' onChange={e => this.setState({ chanSearchText: e.target.value })} />
      <br />
      <br />
      {channels.length === 0 ? <Loader active={this.state.channelsLoad} size='small'>Fetching Channels</Loader> : this.renderChannels()}
      {channelsToMove.length > 0 ?
        <>
        {
          destAdmin == null || destAdmin == "" || destAccountId == null || destAccountId == "" ?
          <Button disabled style={{marginTop: "20px"}} size='small' color='green'>Migrate Channels</Button>
          :
          <Button style={{marginTop: "20px"}} size='small' color='green' onClick={() => this.getDestinationAccountPolicies()}>Migrate Channels</Button>
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
        <Modal className="modal" open={this.state.openChannelMenu} onClose={() => this.setState({openChannelMenu: false})} closeIcon>
          <Modal.Header>What policies do you want to attach these channels to?</Modal.Header>
          <Modal.Content>
            <Input style={{marginBottom: "20px"}} icon='search' placeholder='Search Policies...' onChange={e => this.setState({ destSearchText: e.target.value })} />
            {destPolicies.length === 0 ? <Loader active={this.state.destPoliciesLoad} size='small'>Fetching Policies</Loader> : this.renderDestPolicies()}
          </Modal.Content>
          <Modal.Actions>
            {
              this.state.policiesToReceiveChannels.length > 0 ?
              <Button color='green' onClick={() => this.moveChannels("attach")}>Proceed</Button>
              :
              <Button disabled color='green'>Proceed</Button>
            }
            <Button color='orange' onClick={() => this.moveChannels("skip")}>Skip</Button>
          </Modal.Actions>
        </Modal>
          <Button style={{ float: "right" }} color='black' onClick={this.displayRunLog}>View Run Log</Button>
          {this.state.displayLog ? this.renderLog() : ''}
        <Tab panes={panes} onTabChange={this.handleTabChange}/>
      </>
    )
  }
}
