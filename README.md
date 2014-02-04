# ti-testflight-hook

A titanium cli hook for deploying TestFlight builds.

## Installation

~~~
$ npm install -g ti-testflight-hook
~~~

If you install with `sudo` and get the error `Unable to write config file...` use the following command:

```
$ sudo npm install -g ti-testflight-hook --unsafe-perm
```

## Usage

Then you can added the following, e.g. to your tiapp.xml file.

These must be included:

~~~
  <property name="testflight.api_token">ENTER_API_TOKEN_HERE</property>
  <property name="testflight.team_token">ENTER_TEAM_TOKEN_HERE</property>
~~~

These are optional:

~~~
  <property name="testflight.notify" type="bool">true</property>
  <property name="testflight.distribution_lists">Internal, QA</property>
~~~

**You will be prompted for the release notes.**

Then use the `--testflight` flag with the titanium cli to upload to TestFlight. For example:

~~~
$ ti build -p ios -F ipad -T dist-adhoc --testflight
~~~ 

### Licence MIT
