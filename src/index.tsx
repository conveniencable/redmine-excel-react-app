import * as React from 'react';
import { render } from 'react-dom';
import App from './components/App';
import 'semantic-ui-css/semantic.min.css';

const rootEl = document.getElementById('root');

render(<App />, rootEl);
