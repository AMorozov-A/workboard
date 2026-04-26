import { describe, expect, it } from 'vitest';
import { HttpError } from '../../shared/http-error';
import {
  parseCreateProjectBody,
  parseUpdateProjectBody,
} from './projects.service';

function expectHttpError(fn: () => void, statusCode: number, message?: string) {
  try {
    fn();
    expect.fail('expected HttpError');
  } catch (e) {
    expect(e).toBeInstanceOf(HttpError);
    expect((e as HttpError).statusCode).toBe(statusCode);
    if (message !== undefined) {
      expect((e as HttpError).message).toBe(message);
    }
  }
}

describe('parseCreateProjectBody', () => {
  it('parses valid body; default status active; default keyPrefix proj', () => {
    const input = parseCreateProjectBody({
      title: '  Мой проект  ',
      client: '  Client Co  ',
    });
    expect(input).toMatchObject({
      title: 'Мой проект',
      client: 'Client Co',
      status: 'active',
      keyPrefix: 'proj',
      taskKeyPrefix: 'PROJ',
      description: null,
      budget: null,
      deadline: null,
    });
  });

  it('parses optional fields', () => {
    const input = parseCreateProjectBody({
      title: 'T',
      client: 'C',
      description: 'Desc',
      status: 'paused',
      budget: 1000,
      deadline: '2026-06-01T00:00:00.000Z',
      keyPrefix: 'crm',
      taskKeyPrefix: 'T',
    });
    expect(input.status).toBe('paused');
    expect(input.budget).toBe(1000);
    expect(input.deadline).toBeInstanceOf(Date);
    expect(input.keyPrefix).toBe('crm');
    expect(input.taskKeyPrefix).toBe('T');
  });

  it('throws 400 when body is not an object', () => {
    expectHttpError(() => parseCreateProjectBody(null), 400, 'Ожидается JSON-объект');
    expectHttpError(() => parseCreateProjectBody('x'), 400, 'Ожидается JSON-объект');
  });

  it('throws 400 when title missing or empty', () => {
    expectHttpError(() => parseCreateProjectBody({ client: 'C' }), 400, 'Укажите название проекта');
    expectHttpError(
      () => parseCreateProjectBody({ title: '', client: 'C' }),
      400,
      'Укажите название проекта',
    );
    expectHttpError(
      () => parseCreateProjectBody({ title: '   ', client: 'C' }),
      400,
      'Укажите название проекта',
    );
  });

  it('throws 400 when client missing or empty', () => {
    expectHttpError(() => parseCreateProjectBody({ title: 'T' }), 400, 'Укажите клиента');
    expectHttpError(
      () => parseCreateProjectBody({ title: 'T', client: '' }),
      400,
      'Укажите клиента',
    );
    expectHttpError(
      () => parseCreateProjectBody({ title: 'T', client: '  ' }),
      400,
      'Укажите клиента',
    );
  });

  it('throws 400 on invalid status, budget, deadline', () => {
    expectHttpError(
      () => parseCreateProjectBody({ title: 'T', client: 'C', status: 'nope' }),
      400,
      'Некорректный статус проекта',
    );
    expectHttpError(
      () => parseCreateProjectBody({ title: 'T', client: 'C', budget: NaN }),
      400,
      'Поле budget должно быть числом',
    );
    expectHttpError(
      () => parseCreateProjectBody({ title: 'T', client: 'C', deadline: 'not-a-date' }),
      400,
      'Некорректная дата',
    );
  });

  it('throws 400 on invalid keyPrefix', () => {
    expectHttpError(
      () => parseCreateProjectBody({ title: 'T', client: 'C', keyPrefix: '!!!' }),
      400,
    );
  });

  it('throws 400 on invalid taskKeyPrefix', () => {
    expectHttpError(
      () => parseCreateProjectBody({ title: 'T', client: 'C', taskKeyPrefix: 't-1' }),
      400,
    );
  });
});

describe('parseUpdateProjectBody', () => {
  it('returns empty patch for empty object', () => {
    expect(parseUpdateProjectBody({})).toEqual({});
  });

  it('parses partial fields', () => {
    expect(
      parseUpdateProjectBody({
        title: 'New',
        status: 'done',
      }),
    ).toMatchObject({ title: 'New', status: 'done' });
  });

  it('throws 400 when body is not an object', () => {
    expectHttpError(() => parseUpdateProjectBody(null), 400, 'Ожидается JSON-объект');
  });

  it('throws 400 when title is present but empty', () => {
    expectHttpError(
      () => parseUpdateProjectBody({ title: '' }),
      400,
      'Укажите название проекта',
    );
  });

  it('throws 400 on invalid status in patch', () => {
    expectHttpError(
      () => parseUpdateProjectBody({ status: 'invalid' }),
      400,
      'Некорректный статус проекта',
    );
  });

  it('throws 400 when taskKeyPrefix is present', () => {
    expectHttpError(
      () => parseUpdateProjectBody({ taskKeyPrefix: 'T' }),
      400,
      'Нельзя изменить префикс ключа задач после создания проекта',
    );
  });
});
