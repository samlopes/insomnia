// @flow
import path from 'path';
import { writeFileWithCliOptions } from '../write-file';
import mkdirp from 'mkdirp';
import fs from 'fs';
import { InsoError } from '../errors';

jest.mock('mkdirp', () => ({
  sync: jest.fn().mockResolvedValue(),
}));

jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn().mockResolvedValue(),
  },
}));

describe('writeFileWithCliOptions', () => {
  // make flow happy
  const mock = (mockFn: any) => mockFn;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should write to output file', async () => {
    const output = 'file.yaml';
    const contents = 'contents';
    const workingDir = undefined;

    const promise = writeFileWithCliOptions(output, contents, workingDir);
    await expect(promise).resolves.toBe('file.yaml');
  });

  it('should write to output file under working dir', async () => {
    const output = 'file.yaml';
    const contents = 'contents';
    const workingDir = 'working/dir';

    const promise = writeFileWithCliOptions(output, contents, workingDir);
    await expect(promise).resolves.toBe(path.normalize('working/dir/file.yaml'));
  });

  it('should ensure the output directory exists', async () => {
    const output = 'output/dir/file.yaml';
    const contents = 'contents';
    const workingDir = 'working/dir';

    const result = await writeFileWithCliOptions(output, contents, workingDir);
    expect(result).toEqual(path.normalize('working/dir/output/dir/file.yaml'));

    expect(mkdirp.sync).toHaveBeenCalledWith(path.normalize('working/dir/output/dir'));
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      path.normalize('working/dir/output/dir/file.yaml'),
      contents,
    );
  });

  it('should return an error if make directory fails', async () => {
    const error = new Error('mkdir sync error');
    mock(mkdirp.sync).mockRejectedValue(error);

    const promise = writeFileWithCliOptions('file.yaml', 'contents');
    await expect(promise).rejects.toThrow(new InsoError(`Failed to write to "file.yaml"`, error));
  });

  it('should return an error if write file fails', async () => {
    const error = new Error('fs promises writeFile error');
    mock(fs.promises.writeFile).mockRejectedValue(error);

    const promise = writeFileWithCliOptions('file.yaml', 'contents');
    await expect(promise).rejects.toThrow(new InsoError(`Failed to write to "file.yaml"`, error));
  });
});
