#! /usr/bin/env node

import consola from 'consola';
import { cancel, run } from './cli';

run().catch((e) => {
  consola.error(new Error(e));
  cancel('已终止');
});
