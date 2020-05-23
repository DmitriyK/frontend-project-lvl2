// @ts-check
import path from 'path';
import fs from 'fs';
import has from 'lodash/has';
import isObject from 'lodash/isObject';
import union from 'lodash/union';
import parser from './parsers/index';
import render from './formatters/index';

const getData = (filePath) => {
  const typeFile = path.extname(filePath).substr(1);
  const data = fs.readFileSync(filePath, { encoding: 'utf8' });
  const parsed = parser(data, typeFile);
  return parsed;
};

const getDiff = (data1, data2) => {
  const keys = union(Object.keys(data1), Object.keys(data2)).sort();
  const buildResult = (key) => {
    const value1 = data1[key];
    const value2 = data2[key];
    if (value1 === value2) {
      return { type: 'unchanged', key, value: value1 };
    }
    if (isObject(value1) && isObject(value2)) {
      return { type: 'nested', key, children: getDiff(value1, value2) };
    }
    if (has(data1, key) && !has(data2, key)) {
      return { type: 'deleted', key, deletedValue: value1 };
    }
    if (!has(data1, key) && has(data2, key)) {
      return { type: 'added', key, value: value2 };
    }
    return {
      type: 'changed', key, value: value1, deletedValue: value2,
    };
  };
  return keys.map(buildResult);
};

const genDiff = (path1, path2, format) => {
  const data1 = getData(path1);
  const data2 = getData(path2);
  const differences = getDiff(data1, data2);
  return render(differences, format);
};

export default genDiff;
