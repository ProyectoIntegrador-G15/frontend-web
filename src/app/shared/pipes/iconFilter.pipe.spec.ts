import { IconFilterPipe } from './iconFilter.pipe';

describe('IconFilterPipe', () => {
  let pipe: IconFilterPipe;

  beforeEach(() => {
    pipe = new IconFilterPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty array for null items', () => {
    const result = pipe.transform(null, 'test');
    expect(result).toEqual([]);
  });

  it('should return empty array for undefined items', () => {
    const result = pipe.transform(undefined, 'test');
    expect(result).toEqual([]);
  });

  it('should return all items when searchText is empty', () => {
    const items = ['icon1', 'icon2', 'icon3'];
    const result = pipe.transform(items, '');
    expect(result).toEqual(items);
  });

  it('should return all items when searchText is null', () => {
    const items = ['icon1', 'icon2', 'icon3'];
    const result = pipe.transform(items, null as any);
    expect(result).toEqual(items);
  });

  it('should filter items by search text', () => {
    const items = ['home', 'settings', 'home-outline', 'settings-outline'];
    const result = pipe.transform(items, 'home');
    expect(result.length).toBe(2);
    expect(result).toContain('home');
    expect(result).toContain('home-outline');
  });

  it('should be case insensitive', () => {
    const items = ['Home', 'Settings', 'HOME-OUTLINE'];
    const result = pipe.transform(items, 'home');
    expect(result.length).toBe(2);
  });

  it('should return empty array when no matches', () => {
    const items = ['icon1', 'icon2', 'icon3'];
    const result = pipe.transform(items, 'nonexistent');
    expect(result).toEqual([]);
  });
});

