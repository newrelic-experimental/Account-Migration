[![Community Project header](https://github.com/newrelic/opensource-website/raw/master/src/images/categories/Experimental.png)](https://opensource.newrelic.com/oss-category/#experimental)

# Account Migration

UI to move entities between different New Relic accounts. Currently supports the following entity types:

* Alert Policies & Conditions
* Apdex Scores
* Dashboards
* Labels
* Notification Channels

## What do you need to make this work?

* Admin API keys for both source and destination accounts
* Account IDs for both source and destination accounts

## Getting Started

1. Ensure that you have [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [NPM](https://www.npmjs.com/get-npm) installed. If you're unsure whether you have one or both of them installed, run the following commands. (If you have them installed, these commands return a version number; if not, the commands won't be recognized.)
```bash
git --version
npm -v
```
2. Install the [NR1 CLI](https://one.newrelic.com/launcher/developer-center.launcher) by going to [this link](https://one.newrelic.com/launcher/developer-center.launcher) and following the instructions (5 minutes or less) to install and set up your New Relic development environment.
3. Execute the following commands to clone this repository and run the code locally against your New Relic data:

```bash
nr1 nerdpack:clone -r https://github.com/newrelic-experimental/nr1-account-migration.git
cd nr1-account-migration
nr1 nerdpack:serve
```

Visit [https://one.newrelic.com/?nerdpacks=local](https://one.newrelic.com/?nerdpacks=local), navigate to the Nerdpack, and :sparkles:

## Deploying this Nerdpack
Open a command prompt in the nerdpack's directory and run the following commands:

```bash
# If you need to create a new uuid for the account to which you're deploying this Nerdpack, use the following
# nr1 nerdpack:uuid -g [--profile=your_profile_name]
# to see a list of APIkeys / profiles available in your development environment, run nr1 credentials:list
nr1 nerdpack:publish [--profile=your_profile_name]
nr1 nerdpack:deploy [-c [DEV|BETA|STABLE]] [--profile=your_profile_name]
nr1 nerdpack:subscribe [-c [DEV|BETA|STABLE]] [--profile=your_profile_name]
```

Visit [https://one.newrelic.com](https://one.newrelic.com), navigate to the Nerdpack, and :sparkles:

## Additional Notes
### General
* Nerdpack should be deployed to a master account that contains both source and destination accounts.

### Alerts
* Requires source and destination admin keys & account IDs.
* Only creates and assigns Webhook/Email notification channel types.
* Does not currently create/assign User notification channels to policies.
* Entities are attempted to be assigned upon condition creation. Condition creation will still succeed without entities though, with the exception of Synthetic monitor entity types.
* Infrastructure conditions are not currently supported.
* APM Baseline and Percentile conditions are not currently supported.
* Status column within the Policies tab represents that policy names exist in both accounts.
* Status column within the Notification Channels tab represents that the channel exists in both accounts.

### APM
* Requires source and destination admin keys.
* Status column within the Apdex tab represents that Apdex scores are the same value for both applications with the same name in both accounts.
* Status column within the Labels tab represents that the number of labels within both accounts for the same application name are equal.

### Dashboards
* Requires source and destination admin keys, destination account ID.
* Any widget facet links/filters will need to be updated.
* Moves dashboards in NR1 format (12 column) versus Insights format (3 column).
* Tabbed dashboards are currently not supported.
* Status column represents that dashboard titles exist in both accounts.


## Contributing
We encourage your contributions to improve Account Migration! Keep in mind when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. You only have to sign the CLA one time per project.
If you have any questions, or to execute our corporate CLA, required if your contribution is on behalf of a company,  please drop us an email at opensource@newrelic.com.

## License
Account Migration is licensed under the [Apache 2.0](http://apache.org/licenses/LICENSE-2.0.txt) License.
The Account Migration project also uses source code from third-party libraries. You can find full details on which libraries are used and the terms under which they are licensed in the [third-party notices document](https://github.com/newrelic-experimental/nr1-account-migration/blob/main/THIRD_PARTY_NOTICES.md).
