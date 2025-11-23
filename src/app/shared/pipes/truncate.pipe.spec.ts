import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  let pipe: TruncatePipe;

  beforeEach(() => {
    pipe = new TruncatePipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for null', () => {
    expect(pipe.transform(null as any, 5)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(pipe.transform(undefined as any, 5)).toBe('');
  });

  it('should return full text if word count is less than limit', () => {
    const text = 'This is a short text';
    expect(pipe.transform(text, 10)).toBe(text);
  });

  it('should truncate text if word count exceeds limit', () => {
    const text = 'This is a longer text that should be truncated';
    const result = pipe.transform(text, 5);
    expect(result).toBe('This is a longer text...');
  });

  it('should handle single word', () => {
    expect(pipe.transform('Word', 1)).toBe('Word');
  });

  it('should handle empty string', () => {
    expect(pipe.transform('', 5)).toBe('');
  });
});

