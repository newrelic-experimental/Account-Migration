import React from 'react';
import Dashboard from './dashboard';
import Alerts from './alerts';
import Apm from './apm';
import { Accordion, Button, Form, Icon, Modal, Tab } from 'semantic-ui-react';

export default class Migration extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      sourceAdmin: '',
      sourceAccountId: '',
      destAdmin: '',
      destAccountId: '',
      displayHelp: false,
      activeIndex: -1
    }
  }

  handleChange = (e, data) => this.setState(data)
  handleSourceChange = (e, data) => this.setState({ sourceAdmin: data.value })
  handleSourceAccountChange = (e, data) => this.setState({ sourceAccountId: data.value })
  handleDestChange = (e, data) => this.setState({ destAdmin: data.value })
  handleDestAccountChange = (e, data) => this.setState({ destAccountId: data.value })

  handleClick = (e, titleProps) => {
   const { index } = titleProps
   const { activeIndex } = this.state
   const newIndex = activeIndex === index ? -1 : index

   this.setState({ activeIndex: newIndex })
 }

  renderHelp() {
    const { displayHelp, activeIndex } = this.state;

    return (
      <>
      <Modal size='large' open={displayHelp} onClose={() => this.setState({displayHelp: false})} closeIcon>
        <Modal.Header>Documentation</Modal.Header>
        <Modal.Content scrolling>
          <h3><b>About</b></h3>
          <p>
            Account Migration is an application that allows you to move entities
            between accounts.
          </p>
          <br />
          <p> Currently supports the following entities: </p>
          <Accordion fluid styled>
            <Accordion.Title
              active={activeIndex === 0}
              index={0}
              onClick={this.handleClick}
            >
            <Icon name='dropdown' />
            Alerts
            </Accordion.Title>
              <Accordion.Content active={activeIndex === 0}>
              <p>Move alert policies, associated conditions, and notification channels from one account to another.</p>
              <ul style={{paddingLeft: '20px'}}>
                <li>Requires source admin key & account ID, destination admin key & account ID.</li>
                <li>Webhook/Email notification channel types are currently only available for migration.</li>
                <li>Entities are attempted to be assigned upon condition creation. Condition creation will still succeed without entities though, with the exception of Synthetic monitor entity types (required).</li>
                <li>APM Baseline/Percentile and Infrastructure conditions are not currently supported.</li>
                <li>Status column is derived from the assumption that policy names and notification channel names exists in both source and destination accounts.</li>
              </ul>
            </Accordion.Content>

            <Accordion.Title
              active={activeIndex === 1}
              index={1}
              onClick={this.handleClick}
            >
            <Icon name='dropdown' />
            APM
            </Accordion.Title>
              <Accordion.Content active={activeIndex === 1}>
              <p>Move APM Apdex t-values or Labels from one account to another for migrated APM entities.</p>
              <ul style={{paddingLeft: '20px'}}>
                <li>Requires source and destination admin keys.</li>
                <li>Status column within the Apdex tab represents that Apdex scores are the same value for both applications with the same name in both accounts.</li>
                <li>Status column within the Labels tab represents that the number of labels within both accounts for the same application name are equal.</li>
              </ul>
            </Accordion.Content>

            <Accordion.Title
              active={activeIndex === 2}
              index={2}
              onClick={this.handleClick}
            >
            <Icon name='dropdown' />
            Dashboards
            </Accordion.Title>
              <Accordion.Content active={activeIndex === 2}>
              <p>Move dashboards from one account to another.</p>
              <ul style={{paddingLeft: '20px'}}>
                <li>Requires source admin key & account ID, destination account ID.</li>
                <li>Tabbed dashboards are currently not supported.</li>
                <li>Status column is derived from the assumption that dashboard title exists in both source and destination accounts.</li>
              </ul>
            </Accordion.Content>
          </Accordion>
          <h3><b>Troubleshooting</b></h3>
          <p> General tips: </p>
          <ul style={{paddingLeft: '20px'}}>
            <li>View Run Log allows you to view each run (migration) within a given tab. Use this to see the results of each execution of a migration.</li>
            <li>Check your browser dev tools console log for more detail around any errors occurring.</li>
            <li>Make sure the source/destination accounts are apart of the same master account the nerdpack is deployed to.</li>
          </ul>
        </Modal.Content>
      </Modal>
      </>
    )
  }

  render(){
    let { sourceAdmin, sourceAccountId, destAdmin, destAccountId, displayHelp } = this.state;

    const panes = [
      { menuItem: 'Alerts', render: () => <Tab.Pane><Alerts sourceAdmin={sourceAdmin} sourceAccountId={sourceAccountId} destAdmin={destAdmin} destAccountId={destAccountId}/></Tab.Pane> },
      { menuItem: 'APM', render: () => <Tab.Pane><Apm sourceAdmin={sourceAdmin} sourceAccountId={sourceAccountId} destAdmin={destAdmin} destAccountId={destAccountId}/></Tab.Pane> },
      { menuItem: 'Dashboards', render: () => <Tab.Pane><Dashboard sourceAdmin={sourceAdmin} destAdmin={destAdmin} destAccountId={destAccountId}/></Tab.Pane> }
    ]

    return (
      <>
        <Form>
          <Form.Group style={{paddingLeft: "7px"}}>
          <Form.Input
            inline
            width={3}
            label="Source Admin Key"
            placeholder='abc123'
            value={sourceAdmin}
            onChange={this.handleSourceChange}
          />
          <Form.Input
            inline
            width={2}
            label="Source Account ID"
            placeholder='1234'
            value={sourceAccountId}
            onChange={this.handleSourceAccountChange}
          />
          <Form.Input
            inline
            width={3}
            label="Destination Admin Key"
            placeholder='xyz789'
            value={destAdmin}
            onChange={this.handleDestChange}
          />
          <Form.Input
            inline
            width={2}
            label="Destination Account ID"
            placeholder='5678'
            value={destAccountId}
            onChange={this.handleDestAccountChange}
          />
          <Form.Button
            style={{marginTop: '23px', marginLeft: '641px'}}
            color='blue'
            onClick={() => this.setState({ displayHelp: true })}
          >Help</Form.Button>
          </Form.Group>
        </Form>
        {displayHelp ? this.renderHelp() : ''}
        <Tab panes={panes} onTabChange={this.handleChange} />
      </>
    )
  }

}
