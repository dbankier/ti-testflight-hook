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

Or if you are concerned about using the `--unsafe-perm` flag, use the following command after install
to install the hook instead:

```
$ ti-testflight-hook
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
  <property name="testflight.dsym" type="bool">true</property>
  <property name="testflight.release_notes_file">testflight_release_notes.txt</property>
~~~

**You will be prompted for the release notes if no file is specified. The release notes file is deleted after each build.**

Then use the `--testflight` flag with the titanium cli to upload to TestFlight. For example:

~~~
$ ti build -p ios -F ipad -T dist-adhoc --testflight
~~~ 

### Licence MIT
