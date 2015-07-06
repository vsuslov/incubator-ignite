/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.apache.ignite.cache.affinity;

import org.apache.ignite.cluster.*;
import org.apache.ignite.internal.*;

import java.util.*;

/**
 * Affinity utils.
 */
public class AffinityUtils {
    /**
     * Builds neighborhood map for all nodes in snapshot.
     *
     * @param topSnapshot Topology snapshot.
     * @return Neighbors map.
     */
    public static Map<UUID, Collection<ClusterNode>> neighbors(Collection<ClusterNode> topSnapshot) {
        Map<String, Collection<ClusterNode>> macMap = new HashMap<>(topSnapshot.size(), 1.0f);

        // Group by mac addresses.
        for (ClusterNode node : topSnapshot) {
            String macs = node.attribute(IgniteNodeAttributes.ATTR_MACS);

            Collection<ClusterNode> nodes = macMap.get(macs);

            if (nodes == null)
                macMap.put(macs, nodes = new HashSet<>());

            nodes.add(node);
        }

        Map<UUID, Collection<ClusterNode>> neighbors = new HashMap<>(topSnapshot.size(), 1.0f);

        for (Collection<ClusterNode> group : macMap.values())
            for (ClusterNode node : group)
                neighbors.put(node.id(), group);

        return neighbors;
    }

    /**
     * Returns neighbors for all {@code nodes}.
     *
     * @param neighborhood Neighborhood cache.
     * @param nodes Nodes.
     * @return All neighbors for given nodes.
     */
    public static Collection<ClusterNode> neighborsForNodes(Map<UUID, Collection<ClusterNode>> neighborhood,
        Iterable<ClusterNode> nodes) {
        Collection<ClusterNode> res = new HashSet<>();

        for (ClusterNode node : nodes) {
            if (!res.contains(node))
                res.addAll(neighborhood.get(node.id()));
        }

        return res;
    }
}
