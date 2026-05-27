export async function parsePortError(response: Response): Promise<never> {
  const body = await response.text();
  throw new Error(`Port API ${response.status}:\n${body}`);
}
