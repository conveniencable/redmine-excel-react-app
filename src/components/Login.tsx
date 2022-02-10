import * as React from 'react';
import { Button, Form, Grid, Header, Message, Segment, Input } from 'semantic-ui-react';

import { XFormInput, Validators } from './commons/XForm';
import { useLocation, useHistory } from 'react-router-dom';
import { routerControl } from '../controls/route-control';
import xhelper from '../helpers/xhelper';
import { ValueType } from '../models/commons.model';
import { tryToLogin, useLogin } from '../hooks/auth-hook';
import T from './commons/T';
import { sendCommand } from '../helpers/my_helper';
import { useEffect } from 'react';

export default function Login() {
  const xForm = useLogin();

  const location = useLocation();
  const history = useHistory();
  routerControl.init(location, history);

  (window as any).tryToLogin = tryToLogin;

  useEffect(() => {
    sendCommand('tryToLogin');
  }, []);

  return (
    <Grid textAlign="center" style={{ height: '100vh' }} verticalAlign="middle">
      <Grid.Column style={{ maxWidth: 450 }}>
        <Header as="h2" color="teal" textAlign="center">
          <T>login</T>
        </Header>
        <Form size="large" id="login-form" onSubmit={xForm.submit}>
          <Segment textAlign="left" loading={xForm.loading} disabled={xForm.loading} stacked>
            <Form.Field fluid="true" required>
              <XFormInput
                label=""
                dataType={xhelper.dataType(ValueType.String)}
                placeholder="login"
                name="login"
                xformcontrol={xForm}
                validators={Validators.notBlank}
                options={{
                  required: true,
                  iconPosition: 'left',
                  icon: 'user'
                }}
              ></XFormInput>
            </Form.Field>
            <Form.Field fluid="true">
              <XFormInput
                label=""
                placeholder="password"
                dataType={xhelper.dataType(ValueType.String)}
                name="password"
                xformcontrol={xForm}
                validators={Validators.notBlank}
                options={{
                  required: true,
                  type: 'password',
                  iconPosition: 'left',
                  icon: 'lock'
                }}
              ></XFormInput>
            </Form.Field>
            <Button type="submit" color="teal" fluid size="large">
              <T>login</T>
            </Button>
          </Segment>
        </Form>
      </Grid.Column>
    </Grid>
  );
}
