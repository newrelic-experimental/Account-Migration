module.exports = {
  getPolicies: (accountId) => {
    return `
    {
      actor {
        account(id: ${accountId}) {
          alerts {
            policiesSearch {
              policies {
                id
                incidentPreference
                name
              }
              nextCursor
            }
          }
        }
      }
    }
    `
  },
  createPolicy: (accountId, policy) => {
    return `
    mutation {
      alertsPolicyCreate(accountId: ${accountId}, policy: {incidentPreference: ${policy.incidentPreference}, name: "${policy.name}"}) {
        id
        name
      }
    }
    `
  },
  getSyntheticMonitor: (guid) => {
    return `
    {
      actor {
        entity(guid: "${guid}") {
          ... on SyntheticMonitorEntity {
            name
            monitorId
          }
        }
      }
    }
    `
  },
  getNewSyntheticId: (name, accountId) => {
    return `
    {
      actor {
        entitySearch(query: "domain='SYNTH' and accountId=${accountId} and name='${name}'") {
          results {
            entities {
              ... on SyntheticMonitorEntityOutline {
                name
                monitorId
                accountId
              }
            }
          }
        }
      }
    }
    `
  },
  getNrqlConditions: (accountId, policyId) => {
    return `
    {
      actor {
        account(id: ${accountId}) {
          alerts {
            nrqlConditionsSearch(searchCriteria: {policyId: ${policyId}}) {
              nextCursor
              nrqlConditions {
                ... on AlertsNrqlStaticCondition {
                  id
                  name
                  nrql {
                    evaluationOffset
                    query
                  }
                  description
                  enabled
                  policyId
                  runbookUrl
                  terms {
                    operator
                    priority
                    threshold
                    thresholdDuration
                    thresholdOccurrences
                  }
                  type
                  violationTimeLimit
                  valueFunction
                }
                ... on AlertsNrqlBaselineCondition {
                  id
                  name
                  nrql {
                    evaluationOffset
                    query
                  }
                  policyId
                  runbookUrl
                  terms {
                    operator
                    priority
                    threshold
                    thresholdDuration
                    thresholdOccurrences
                  }
                  type
                  violationTimeLimit
                  baselineDirection
                  description
                  enabled
                }
                ... on AlertsNrqlOutlierCondition {
                  id
                  name
                  nrql {
                    evaluationOffset
                    query
                  }
                  description
                  enabled
                  expectedGroups
                  openViolationOnGroupOverlap
                  policyId
                  runbookUrl
                  terms {
                    operator
                    priority
                    threshold
                    thresholdDuration
                    thresholdOccurrences
                  }
                  type
                  violationTimeLimit
                }
              }
            }
          }
        }
      }
    }
    `
  },
  createBaselineNrqlCondition: (accountId, baseline, policyId) => { //violationTimer required because alerts team is trying to get more people to use it
    for (let term of baseline.terms){
      delete term.__typename;
    }
    let vt = baseline.violationTimeLimit == null ? "TWENTY_FOUR_HOURS" : baseline.violationTimeLimit

    if (baseline.terms.length > 1) {
      return `
      mutation {
        alertsNrqlConditionBaselineCreate(accountId: ${accountId}, condition: {baselineDirection: ${baseline.baselineDirection}, description: "${baseline.description}", enabled: ${baseline.enabled}, name: "${baseline.name}", nrql: {evaluationOffset: ${baseline.nrql.evaluationOffset}, query: "${baseline.nrql.query}"}, runbookUrl: "${baseline.runbookUrl}", terms: [{operator: ${baseline.terms[0].operator}, priority: ${baseline.terms[0].priority}, threshold: ${baseline.terms[0].threshold}, thresholdDuration: ${baseline.terms[0].thresholdDuration}, thresholdOccurrences: ${baseline.terms[0].thresholdOccurrences}}, {operator: ${baseline.terms[1].operator}, priority: ${baseline.terms[1].priority}, threshold: ${baseline.terms[1].threshold}, thresholdDuration: ${baseline.terms[1].thresholdDuration}, thresholdOccurrences: ${baseline.terms[1].thresholdOccurrences}}], violationTimeLimit: ${vt}}, policyId: ${policyId}) {
          id
          name
        }
      }
      `
    } else {
      return `
      mutation {
        alertsNrqlConditionBaselineCreate(accountId: ${accountId}, condition: {baselineDirection: ${baseline.baselineDirection}, description: "${baseline.description}", enabled: ${baseline.enabled}, name: "${baseline.name}", nrql: {evaluationOffset: ${baseline.nrql.evaluationOffset}, query: "${baseline.nrql.query}"}, runbookUrl: "${baseline.runbookUrl}", terms: {operator: ${baseline.terms[0].operator}, priority: ${baseline.terms[0].priority}, threshold: ${baseline.terms[0].threshold}, thresholdDuration: ${baseline.terms[0].thresholdDuration}, thresholdOccurrences: ${baseline.terms[0].thresholdOccurrences}}, violationTimeLimit: ${vt}}, policyId: ${policyId}) {
          id
          name
        }
      }
      `
    }
  },
  createOutlierNrqlCondition: (accountId, outlier, policyId) => {
    for (let term of outlier.terms) {
      delete term.__typename;
    }
    let vt = outlier.violationTimeLimit == null ? "TWENTY_FOUR_HOURS" : outlier.violationTimeLimit

    if (outlier.terms.length > 1) {
      return `
      mutation {
        alertsNrqlConditionOutlierCreate(accountId: ${accountId}, condition: {description: "${outlier.description}", enabled: ${outlier.enabled}, expectedGroups: ${outlier.expectedGroups}, name: "${outlier.name}", nrql: {evaluationOffset: ${outlier.nrql.evaluationOffset}, query: "${outlier.nrql.query}"}, openViolationOnGroupOverlap: ${outlier.openViolationOnGroupOverlap}, runbookUrl: "${outlier.runbookUrl}", terms: [{operator: ${outlier.terms[0].operator}, priority: ${outlier.terms[0].priority}, threshold: ${outlier.terms[0].threshold}, thresholdDuration: ${outlier.terms[0].thresholdDuration}, thresholdOccurrences: ${outlier.terms[0].thresholdOccurrences}},{operator: ${outlier.terms[1].operator}, priority: ${outlier.terms[1].priority}, threshold: ${outlier.terms[1].threshold}, thresholdDuration: ${outlier.terms[1].thresholdDuration}, thresholdOccurrences: ${outlier.terms[1].thresholdOccurrences}}], violationTimeLimit: ${vt}}, policyId: ${policyId}) {
          name
          id
        }
      }
      `
    } else {
      return `
      mutation {
        alertsNrqlConditionOutlierCreate(accountId: ${accountId}, condition: {description: "${outlier.description}", enabled: ${outlier.enabled}, expectedGroups: ${outlier.expectedGroups}, name: "${outlier.name}", nrql: {evaluationOffset: ${outlier.nrql.evaluationOffset}, query: "${outlier.nrql.query}"}, openViolationOnGroupOverlap: ${outlier.openViolationOnGroupOverlap}, runbookUrl: "${outlier.runbookUrl}", terms: {operator: ${outlier.terms[0].operator}, priority: ${outlier.terms[0].priority}, threshold: ${outlier.terms[0].threshold}, thresholdDuration: ${outlier.terms[0].thresholdDuration}, thresholdOccurrences: ${outlier.terms[0].thresholdOccurrences}}, violationTimeLimit: ${vt}}, policyId: ${policyId}) {
          name
          id
        }
      }
      `
    }

  },
  createStaticNrqlCondition: (accountId, stat, policyId) => {
    delete stat.nrql.__typename;
    for (let term of stat.terms) {
      delete term.__typename;
    }
    let vt = stat.violationTimeLimit == null ? "TWENTY_FOUR_HOURS" : stat.violationTimeLimit


    if (stat.terms.length > 1) {
      return `
      mutation {
        alertsNrqlConditionStaticCreate(accountId: ${accountId}, condition: {description: "${stat.description}", enabled: ${stat.enabled}, name: "${stat.name}", nrql: {evaluationOffset: ${stat.nrql.evaluationOffset}, query: "${stat.nrql.query}"}, runbookUrl: "${stat.runbookUrl}", terms: [{operator: ${stat.terms[0].operator}, priority: ${stat.terms[0].priority}, threshold: ${stat.terms[0].threshold}, thresholdDuration: ${stat.terms[0].thresholdDuration}, thresholdOccurrences: ${stat.terms[0].thresholdOccurrences}}, {operator: ${stat.terms[1].operator}, priority: ${stat.terms[1].priority}, threshold: ${stat.terms[1].threshold}, thresholdDuration: ${stat.terms[1].thresholdDuration}, thresholdOccurrences: ${stat.terms[1].thresholdOccurrences}}], valueFunction: ${stat.valueFunction}, violationTimeLimit: ${vt}}, policyId: ${policyId}) {
          name
          id
        }
      }
      `
    } else {
      return `
      mutation {
        alertsNrqlConditionStaticCreate(accountId: ${accountId}, condition: {description: "${stat.description}", enabled: ${stat.enabled}, name: "${stat.name}", nrql: {evaluationOffset: ${stat.nrql.evaluationOffset}, query: "${stat.nrql.query}"}, runbookUrl: "${stat.runbookUrl}", terms: {operator: ${stat.terms[0].operator}, priority: ${stat.terms[0].priority}, threshold: ${stat.terms[0].threshold}, thresholdDuration: ${stat.terms[0].thresholdDuration}, thresholdOccurrences: ${stat.terms[0].thresholdOccurrences}}, valueFunction: ${stat.valueFunction}, violationTimeLimit: ${vt}}, policyId: ${policyId}) {
          name
          id
        }
      }
      `
    }
  }
};
