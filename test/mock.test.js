test('testing mock', () => {
    const mock = jest.fn();
    console.log(mock);

    let result = mock("foo");
    expect(result).toBeUndefined();
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith("foo");
});