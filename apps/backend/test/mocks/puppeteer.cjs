module.exports = {
  launch: async () => ({
    newPage: async () => ({
      setContent: async () => undefined,
      pdf: async () => Buffer.from(''),
    }),
    close: async () => undefined,
  }),
};
