/**********************************************************************
 * Copyright (C) 2025 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/

import type { McpPage } from 'src/model/pages/mcp-page';

import { test } from '../fixtures/provider-fixtures';
import { waitForNavigationReady } from '../utils/app-ready';
import { hasApiKey, PROVIDERS } from '../utils/resource-helper';

const DEFAULT_REGISTRY: string = 'MCP Registry example';
const REGISTRY_URL: string = 'https://registry.modelcontextprotocol.io';
const GITHUB_MCP_SERVER: string = 'com.github.mcp';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? '';
let mcpServersPage: McpPage;

test.beforeAll(async ({ page, navigationBar, resource }) => {
  if (!hasApiKey(resource)) {
    const provider = PROVIDERS[resource];
    test.skip(true, `${provider.envVarName} environment variable is not set`);
  }
  await waitForNavigationReady(page);
  mcpServersPage = await navigationBar.navigateToMCPPage();
});

test.describe('MCP page navigation', { tag: '@smoke' }, () => {
  test('[MCP-01] Add and remove MCP registry: verify server list updates accordingly', async () => {
    const editRegistriesTab = await mcpServersPage.openEditRegistriesTab();
    await editRegistriesTab.ensureRowExists(DEFAULT_REGISTRY);
    const installTab = await mcpServersPage.openInstallTab();
    await installTab.verifyInstallTabIsNotEmpty();
    const initialServerCount = await installTab.countRowsFromTable();

    await mcpServersPage.openEditRegistriesTab();
    await editRegistriesTab.addNewRegistry(REGISTRY_URL);
    await editRegistriesTab.ensureRowExists(REGISTRY_URL);
    await mcpServersPage.openInstallTab();
    await installTab.verifyServerCountIncreased(initialServerCount, 60_000);

    await mcpServersPage.openEditRegistriesTab();
    await editRegistriesTab.removeRegistry(REGISTRY_URL);
    await editRegistriesTab.ensureRowDoesNotExist(REGISTRY_URL);
    await mcpServersPage.openInstallTab();
    await installTab.verifyServerCountIsRestored(initialServerCount);
  });

  test('[MCP-02] Open MCP setup when no servers are installed', async ({ navigationBar }) => {
    const chatPage = await navigationBar.navigateToChatPage();
    await chatPage.verifyNoMcpServersInstalled();
    await chatPage.openMcpSetupIfNoneInstalled();
  });

  test('[MCP-03] Configure and verify GitHub MCP Server installation', async ({ navigationBar }) => {
    test.skip(GITHUB_TOKEN === '', 'Skip the test as a github token is not set');
    const editRegistriesTab = await mcpServersPage.openEditRegistriesTab();
    await editRegistriesTab.ensureRowExists(DEFAULT_REGISTRY);

    const installTab = await mcpServersPage.openInstallTab();
    await installTab.ensureRowExists(GITHUB_MCP_SERVER);
    const addingMcpServerPage = await installTab.startMcpServerInstallation(GITHUB_MCP_SERVER);
    await addingMcpServerPage.fillInputFieldByLabel('Value', GITHUB_TOKEN);
    const mcpReadyTabPage = await addingMcpServerPage.connectToRemoteMcpServer();
    await mcpReadyTabPage.ensureRowExists(GITHUB_MCP_SERVER);

    const chatPage = await navigationBar.navigateToChatPage();
    await chatPage.verifyMcpServerAvailable(GITHUB_MCP_SERVER);
  });

  test('[MCP-04] Remove GitHub MCP Server', async ({ navigationBar }) => {
    test.skip(GITHUB_TOKEN === '', 'Skip the test as a github token is not set');
    const mcpServersPage = await navigationBar.navigateToMCPPage();
    const mcpReadyTabPage = await mcpServersPage.openReadyTab();

    await mcpReadyTabPage.removeMcpServer(GITHUB_MCP_SERVER);
    await mcpReadyTabPage.ensureRowDoesNotExist(GITHUB_MCP_SERVER);

    const chatPage = await navigationBar.navigateToChatPage();
    await chatPage.verifyNoMcpServersInstalled();
  });
});
