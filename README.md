# Openstax Resource Name (ORN)
ORNs provide a way to universally identify resources. A resource could be a book, a part of a book, a quiz, an ancillary resource, or any other type of thing that we need to define. An ORN may include a UUID, but it will also provide the context necessary to identify the resource type based on the identifier.

# Format
ORN are defined in [IRI](https://www.w3.org/International/iri-edit/draft-duerst-iri.html) format. We use this format for a few reasons:
1. we integrate with xAPI systems and that spec requires activities to be identified in IRI format
1. the format makes it easy to include contextual information to recognize the types of resources
1. its not necessarily required that the IRI actually resolve to anything if you tried to load it in a browser (many xAPI identifiers don't) but we have the option of someday introducing a little service that would know how to resolve metadata about resources or redirect you to view/manage interfaces for the resource.

IRI is a very open ended format, so for ORN we've decided to limit the structure to this:
> https://openstax.org/orn/{resource-type}/{resource-id}

eg:
> https://openstax.org/orn/ancillary/031da8d3-b525-429c-80cf-6c8ed997733a

> https://openstax.org/orn/assessment/031da8d3-b525-429c-80cf-6c8ed997733a

> https://openstax.org/orn/content:page/031da8d3-b525-429c-80cf-6c8ed997733a:1d1fd537-77fb-4eac-8a8a-60bbaa747b6d

> https://openstax.org/orn/content:book/031da8d3-b525-429c-80cf-6c8ed997733a

> https://openstax.org/orn/content:learning-objective/031da8d3-b525-429c-80cf-6c8ed997733a:1d1fd537-77fb-4eac-8a8a-60bbaa747b6d:id-1231

each resource type can use whatever identifier format is most useful. the ID should provide enough information to be able to locate the resource given the understanding of the ID format. It won't be expected that the knowledge of how to interpret these IRI will need to be reproduced in all the places that they are used, we may provide tools such as shared libraries, or a small microservice, to help interpret them in a centralized way.

for instance identifying a learning objective with only a uuid or element id doesn't help you locate its definition, you need to know where in the content to find it, so we can create a better identifier by concatenating the source content with the learning objective id.

# Purpose
Openstax has a variety of content and activity types using different technologies and different formats. These resources are usually about other resources. This can be in a direct way, like exercises that assess the knowledge learned by reading a certain section of content or watching a certain video or performing a certain activity, or in a dependent way, like topics that build on knowledge from other topics. In any case, we have a need to be able to create a graph of our various content resources and that starts with being able to universally identify, recognize, and locate those resources.

# This Repository
use this repository to:
- create github issues and have discussions about how to identify different types of resources
- write code for the serialization and/or de-serialization of resources to IRI
- publish that code in re-usable libraries so that tools/apps can easily work with resources/iri to generate iri and extract metadata
- publish that code in a microservice so that tools/apps can choose to integrate with that instead of a library
- define a standard interface for resource metadata like name/description/etc
