import { SearchPipe } from './search.pipe';

describe('SearchPipe', () => {
  let pipe: SearchPipe;

  beforeEach(() => {
    pipe = new SearchPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return all items when term is empty', () => {
    const items = [
      { name: 'Item 1', description: 'Test' },
      { name: 'Item 2', description: 'Test' }
    ];
    const result = pipe.transform(items, 'name', '');
    expect(result).toEqual(items);
  });

  it('should return all items when term is null', () => {
    const items = [
      { name: 'Item 1', description: 'Test' }
    ];
    const result = pipe.transform(items, 'name', null);
    expect(result).toEqual(items);
  });

  it('should filter items by single key', () => {
    const items = [
      { name: 'Apple', description: 'Fruit' },
      { name: 'Banana', description: 'Fruit' },
      { name: 'Carrot', description: 'Vegetable' }
    ];
    const result = pipe.transform(items, 'name', 'Apple');
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Apple');
  });

  it('should filter items by multiple keys', () => {
    const items = [
      { name: 'Apple', description: 'Fruit' },
      { name: 'Banana', description: 'Fruit' },
      { name: 'Carrot', description: 'Vegetable' }
    ];
    const result = pipe.transform(items, 'name,description', 'Fruit');
    expect(result.length).toBe(2);
  });

  it('should be case insensitive', () => {
    const items = [
      { name: 'Apple', description: 'Fruit' },
      { name: 'Banana', description: 'Fruit' }
    ];
    const result = pipe.transform(items, 'name', 'apple');
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Apple');
  });

  it('should return empty array for null items', () => {
    const result = pipe.transform(null, 'name', 'test');
    expect(result).toEqual([]);
  });

  it('should return empty array for undefined items', () => {
    const result = pipe.transform(undefined, 'name', 'test');
    expect(result).toEqual([]);
  });
});

